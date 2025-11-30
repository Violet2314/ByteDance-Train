import React from 'react'
import { AutoComplete } from 'antd'

const TIME_OPTIONS = [{ value: '次日达' }, { value: '1-2天' }, { value: '3-5天' }]

interface TimeInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

/**
 * 时间输入组件
 *
 * 带有自动补全功能的输入框，用于输入配送时效。
 * 提供常用的时间选项（如：次日达、1-2天）。
 */
export const TimeInput = React.memo(({ value, onChange, placeholder }: TimeInputProps) => {
  return (
    <AutoComplete
      value={value}
      onChange={onChange}
      options={TIME_OPTIONS}
      placeholder={placeholder || '请选择或输入 (如: 2-3天)'}
      filterOption={(inputValue, option) =>
        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
      }
    />
  )
})
