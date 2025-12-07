/**
 * 科幻风格按钮组件
 * 带扫光效果的按钮
 */

import React from 'react';
import { Button } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd/es/button';
import classNames from 'classnames';
import './CyberButton.css';

interface CyberButtonProps extends AntButtonProps {
  glow?: boolean;
  cyber?: boolean;
}

const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  className,
  glow = false,
  cyber = true,
  ...props
}) => {
  const btnClass = classNames(
    {
      'cyber-button': cyber,
      'cyber-button-glow': glow,
    },
    className
  );

  return (
    <Button className={btnClass} {...props}>
      {children}
    </Button>
  );
};

export default CyberButton;

