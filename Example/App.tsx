import React, {useCallback} from 'react';
import {View, Text, StyleSheet, Image, Alert} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Controller from 'react-native-webview-controller';

import useViewport from './useViewport';

function App(props: {}){
    const viewport = useViewport();
    const onPress = useCallback(() => {
        Alert.alert('Hello')
    }, []);
    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <Image source={require('./assets/background.jpeg')} style={{width: viewport.width, height: viewport.height}}/>
                <Controller onPress={onPress}/>
            </View>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: '600',
    }
})

export default App