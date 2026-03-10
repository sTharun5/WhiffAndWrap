import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    circle?: boolean;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    circle,
    borderRadius,
    className = '',
    style
}) => {
    const combinedStyle: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : (borderRadius || 'var(--radius-md)'),
        ...style
    };

    return (
        <div
            className={`skeleton-loader animate-shimmer ${className}`}
            style={combinedStyle}
        />
    );
};

export default Skeleton;
