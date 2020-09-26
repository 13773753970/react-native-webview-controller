import React, {useMemo, useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {Easing, Clock} from 'react-native-reanimated';
import {PanGestureHandler, State, TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {onGestureEvent, snapPoint} from 'react-native-redash';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useViewport from './useViewport';
import BackIcon from './BackIcon';

const {Value, lessThan, greaterThan, multiply, useCode, block, cond, eq, set, add, call, interpolate, timing, clockRunning, startClock, stopClock, not, neq, and} = Animated;

const CONTROLLER_WIDTH = 40;

type Props = {
    onPress: () => void
}

function Controller(props: Props){  
    const {onPress} = props;

    const {width: viewportWidth, height: viewportHeight} = useViewport();
    const insets = useSafeAreaInsets();

    // opacity relevant
    const fadingIn: Animated.Value<0 | 1> = useMemo(() => new Value(0), []);
    const fadingOut:  Animated.Value<0 | 1> = useMemo(() => new Value(0), []);

    // gesture relevant
    const translationX = useMemo(() => new Value(0), []);
    const translationY = useMemo(() => new Value(0), []);
    const velocityX = useMemo(() => new Value(0), []);
    const velocityY = useMemo(() => new Value(0), []);
    const state = useMemo(() => new Value(State.UNDETERMINED), []);
    const gestureHandler = useMemo(() => onGestureEvent({state, translationX, translationY, velocityX, velocityY}), []);

    // controller translate
    const translateX = useMemo(() => new Value(viewportWidth - CONTROLLER_WIDTH - 10 - insets.right), [viewportWidth, viewportHeight, insets]);
    const translateY = useMemo(() => new Value(insets.top + 20), [viewportWidth, viewportHeight, insets]);

    // controller opacity
    const opacity = useMemo(() => {
        const fadeInClock = new Clock();
        const fadeOutClock = new Clock();
        const opacityState = {
            finished: new Value(0),
            position: new Value(1), // opacity
            frameTime: new Value(0),
            time: new Value(0),
        }
        const opacityConfig = {
            toValue: new Value(1),
            duration: new Value(250),
            easing: Easing.linear,
        }
        return block([
            cond(
                fadingIn,
                [
                    cond(clockRunning(fadeOutClock), stopClock(fadeOutClock)),
                    cond(
                        not(clockRunning(fadeInClock)),
                        [
                            startClock(fadeInClock),
                            set(opacityState.finished, 0),
                            set(opacityState.frameTime, 0),
                            set(opacityState.time, 0),
                            set(opacityConfig.toValue, 1),
                            set(opacityConfig.duration, 100),
                        ]
                    ),
                    timing(fadeInClock, opacityState, opacityConfig),
                    cond(opacityState.finished, [stopClock(fadeInClock), set(fadingIn, 0)]),
                ]
            ),
            cond(
                fadingOut,
                [
                    cond(clockRunning(fadeInClock), stopClock(fadeInClock)),
                    cond(
                        not(clockRunning(fadeOutClock)),
                        [
                            startClock(fadeOutClock),
                            set(opacityState.finished, 0),
                            set(opacityState.frameTime, 0),
                            set(opacityState.time, 0),
                            set(opacityConfig.toValue, 0.4),
                            set(opacityConfig.duration, 600),
                        ]
                    ),
                    timing(fadeOutClock, opacityState, opacityConfig),
                    cond(opacityState.finished, [stopClock(fadeOutClock), set(fadingOut, 0)]),
                ]
            ),
            opacityState.position,
        ])
    }, []);

    // fade out delay
    const timer = useRef<number | null>();
    const clearFadeOut = useCallback(() => {
        if(timer.current){
            clearTimeout(timer.current);
        }
    }, []);
    const fadeOut = useCallback(() => {
        clearFadeOut();
        timer.current = setTimeout(() => {
            fadingIn.setValue(0);
            fadingOut.setValue(1);
        }, 3000);
    }, [clearFadeOut]);

    // init fadeOut
    useEffect(() => {
        fadeOut();
        return clearFadeOut;
    }, [clearFadeOut]);

    useCode(() => {
        const boundaryTop = insets.top + 20;
        const boundaryBottom = insets.bottom + 20;
        const boundaryLeft = insets.left + 10;
        const boundaryRight = insets.right + 10;

        // transition relevant
        const transitionClock = new Clock();
        const transitionState = {
            finished: new Value(0),
            position: new Value(0), // transition
            frameTime: new Value(0),
            time: new Value(0),
        };
        const transitionConfig = {
            toValue: new Value(1),
            duration: 250,
            easing: Easing.bezier(0.33, 1, 0.68, 1),
        };

        const snapX = new Value(100);
        const snapY = new Value(100);

        const endX = new Value(0);
        const endY = new Value(0);

        return block([
            cond(eq(state, State.BEGAN), [
                set(fadingIn, 1),
                set(fadingOut, 0),
                call([], clearFadeOut),
                set(snapX, translateX),
                set(snapY, translateY),
                set(transitionState.finished, 0),
                set(transitionState.position, 0),
                set(transitionState.frameTime, 0),
                set(transitionState.time, 0),
                stopClock(transitionClock),
            ]),
            cond(eq(state, State.ACTIVE), [
                set(translateX, add(snapX, translationX)),
                set(translateY, add(snapY, translationY)),
            ]),
            cond(eq(state, State.END), [
                cond(and(not(clockRunning(transitionClock)), neq(transitionState.finished, 1)), [
                    set(snapX, translateX),
                    set(snapY, translateY),
                    set(endX, translateX),
                    cond(
                        lessThan(translateY, boundaryTop + 40),
                        set(endY, boundaryTop),
                        cond(
                            greaterThan(add(translateY, CONTROLLER_WIDTH), viewportHeight - boundaryBottom - 40),
                            set(endY, viewportHeight - boundaryBottom - CONTROLLER_WIDTH),
                            // Y the screens main place
                            [
                                cond(
                                    lessThan(velocityY, -2000),
                                    set(endY, boundaryTop),
                                    cond(
                                        greaterThan(velocityY, 2000), 
                                        set(endY, viewportHeight - boundaryBottom - CONTROLLER_WIDTH),
                                        set(endY, translateY), 
                                    )
                                ),
                                set(endX, snapPoint(translateX, multiply(velocityX, 0.2), [boundaryLeft, viewportWidth - CONTROLLER_WIDTH - boundaryRight]))
                            ],
                        )
                    ),
                    cond(lessThan(translateX, boundaryLeft), set(endX, boundaryLeft)),
                    cond(greaterThan(translateX, viewportWidth - CONTROLLER_WIDTH - boundaryRight), set(endX, viewportWidth - CONTROLLER_WIDTH - boundaryRight)),
                    startClock(transitionClock),
                ]),
                cond(eq(transitionState.finished, 1), [
                    stopClock(transitionClock),
                    call([], fadeOut),
                ]),
                timing(transitionClock, transitionState, transitionConfig),
                set(translateX, interpolate(transitionState.position, {
                    inputRange: [0, 1],
                    outputRange: [snapX, endX]
                })),
                set(translateY, interpolate(transitionState.position, {
                    inputRange: [0, 1],
                    outputRange: [snapY, endY]
                }))
            ]),
        ])
    }, [insets, viewportWidth, viewportHeight, clearFadeOut, fadeOut]);

    // useCode(() => block([
    //     call([velocityY], (velocityY) => console.log(velocityY)),
    // ]), []);

    return (
        <Animated.View style={[styles.container, {opacity, transform: [{translateX}, {translateY}]}]}>
            <PanGestureHandler {...gestureHandler}>
                <Animated.View style={styles.inner}>
                    <TouchableWithoutFeedback 
                        onPressIn={() => {
                            fadingOut.setValue(0);
                            fadingIn.setValue(1);
                            clearFadeOut();
                        }}
                        onPressOut={() => {
                            fadeOut();
                        }}
                        onPress={onPress}
                    >
                        <View style={styles.inner}>
                            <BackIcon size={20} fill="white"/>
                        </View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </PanGestureHandler>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: CONTROLLER_WIDTH,
        height: CONTROLLER_WIDTH,
        borderRadius: CONTROLLER_WIDTH,
        left: 0,
        top: 0,
    },
    inner: {
        width: CONTROLLER_WIDTH,
        height: CONTROLLER_WIDTH,
        borderRadius: CONTROLLER_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black'
    }
})

export default React.memo(Controller)