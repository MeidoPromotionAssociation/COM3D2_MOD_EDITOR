// ColorPickerSync.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ColorPicker, Form, Space} from 'antd';
import debounce from 'lodash/debounce';
import {AggregationColor} from "antd/es/color-picker/color";


interface ColorPickerSyncProps {
    form: any;
    name: number; // 当前 properties 数组的索引
}

const ColorPickerSync: React.FC<ColorPickerSyncProps> = ({form, name}) => {
    // 监听表单中当前项的颜色数值
    const property = Form.useWatch(['properties', name], form) || {};
    const {colorR = 255, colorG = 255, colorB = 255, colorA = 1} = property;

    // 根据数值输入框数据构造 AggregationColor 对象
    const currentAggregationColor = useMemo(() => {
        const componentToHex = (c: number): string => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        const alpha = Math.round(colorA * 255);
        const hexString =
            '#' +
            componentToHex(colorR) +
            componentToHex(colorG) +
            componentToHex(colorB) +
            componentToHex(alpha);
        return new AggregationColor(hexString);
    }, [colorR, colorG, colorB, colorA]);

    // 使用局部状态控制 ColorPicker 的值，确保交互即时
    const [localColor, setLocalColor] = useState<AggregationColor>(currentAggregationColor);

    // 当数值输入框更新时，同步 localColor，避免出现“回弹”
    useEffect(() => {
        if (!localColor.equals(currentAggregationColor)) {
            setLocalColor(currentAggregationColor);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAggregationColor]);

    // 更新表单中数值输入框的数据
    const updateNumericFields = useCallback((newColor: AggregationColor) => {
        // 假设 newColor.toRgb() 返回 { r, g, b, a }
        const rgb = newColor.toRgb();
        const currentProperties = form.getFieldValue('properties') || [];
        const updatedProperties = [...currentProperties];
        updatedProperties[name] = {
            ...updatedProperties[name],
            colorR: rgb.r,
            colorG: rgb.g,
            colorB: rgb.b,
            colorA: rgb.a,
        };
        form.setFieldsValue({properties: updatedProperties});
    }, [form, name]);

    // 使用防抖函数延迟更新表单，避免频繁更新导致卡顿
    const debouncedUpdate = useMemo(
        () =>
            debounce((newColor: AggregationColor) => {
                updateNumericFields(newColor);
            }, 200),
        [updateNumericFields]
    );

    const handleColorChange = useCallback(
        (color: AggregationColor) => {
            // 先立即更新局部状态，保证选色器显示流畅
            setLocalColor(color);
            // 延迟更新表单中的数值
            debouncedUpdate(color);
        },
        [debouncedUpdate]
    );

    return (
        <Space>
            <ColorPicker value={localColor} onChange={handleColorChange} defaultFormat='rgb'/>
        </Space>
    );
};

export default React.memo(ColorPickerSync);
