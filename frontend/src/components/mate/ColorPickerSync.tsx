// ColorPickerSync.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ColorPicker, Form, FormInstance, Space} from 'antd';
import debounce from 'lodash/debounce';
import {AggregationColor} from "antd/es/color-picker/color";


interface ColorPickerSyncProps {
    form: FormInstance;
    name: number; // 当前 properties 数组的索引
}

const ColorPickerSync: React.FC<ColorPickerSyncProps> = ({form, name}) => {
    // 监听表单中当前项的颜色数值
    const property = Form.useWatch(['properties', name], form) || {};
    const {colorR = 1, colorG = 1, colorB = 1, colorA = 1} = property;

    // 根据数值输入框数据构造 AggregationColor 对象
    const currentAggregationColor = useMemo(() => {
        // 转成 [0,255]
        const to255 = (val: number) => Math.round(val * 255);

        const componentToHex = (c: number): string => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        const r255 = to255(colorR);
        const g255 = to255(colorG);
        const b255 = to255(colorB);
        const a255 = to255(colorA);

        const hexString =
            '#' +
            componentToHex(r255) +
            componentToHex(g255) +
            componentToHex(b255) +
            componentToHex(a255);

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
        // newColor.toRgb() 返回 { r, g, b, a }
        const rgba = newColor.toRgb();

        const currentProperties = form.getFieldValue('properties') || [];
        const updatedProperties = [...currentProperties];

        // 注意：选色器中的 r, g, b 为 [0,255]，而表单存储 [0,1]
        updatedProperties[name] = {
            ...updatedProperties[name],
            colorR: rgba.r / 255,
            colorG: rgba.g / 255,
            colorB: rgba.b / 255,
            colorA: rgba.a,
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
