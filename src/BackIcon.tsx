import React from 'react';
import {Path, Svg} from 'react-native-svg';

type Props = {
    size: number,
    fill: string
}

function BackIcon(props: Props){
    const {size, fill} = props;
    return (
        <Svg viewBox="0 0 1024 1024" width={size} height={size}>
            <Path fill={fill} d="M622.65 284.902H447.746V142.824L63.981 334.705l383.763 191.882V384.835h189.392c149.914 0 224.855 62.789 224.855 188.368 0 129.928-77.436 194.876-232.339 194.876h-441.7v99.932h446.194c211.185 0 316.778-95.104 316.778-285.31 0-198.522-109.414-297.8-328.273-297.8z"/>
        </Svg>
    )
}

export default BackIcon