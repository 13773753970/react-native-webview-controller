import React, { useState, useEffect } from 'react';
import {Dimensions} from 'react-native';
import Orientation, {OrientationType} from 'react-native-orientation-locker';

const useViewport = () => {
    const [state, setState] = useState({width: Dimensions.get('window').width, height: Dimensions.get('window').height});
    
    useEffect(() => {
        let prevWidth = Dimensions.get('window').width;
        let prevHeight = Dimensions.get('window').height;
        const listener = (orientation: OrientationType) => {
            const width = Dimensions.get('window').width;
            const height = Dimensions.get('window').height;
            if(width !== prevWidth || height !== prevHeight){
                setState({width, height});
                prevWidth = width;
                prevHeight = height;
            }
        }
        Orientation.addOrientationListener(listener);
        return () => Orientation.removeOrientationListener(listener);
    }, []);

    return state;
}

export default useViewport