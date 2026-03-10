import React from 'react';
import { theme } from '../../theme/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    showIcon?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    showIcon = true,
    className = '',
    ...props
}) => {
    const brandColor = theme.colors.brand;

    return (
        <button
            {...props}
            className={`flex justify-center gap-2 items-center text-sm md:text-base bg-white/80 backdrop-blur-md font-bold isolation-auto border-[#2c258e]/30 before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-[#2c258e] hover:text-white before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700 relative z-10 px-6 py-2.5 overflow-hidden border-2 rounded-full group transition-all duration-300 ${className}`}
            style={{ fontFamily: theme.fonts.main }}
        >
            {children}
            {showIcon && (
                <svg
                    className="w-6 h-6 justify-end group-hover:rotate-90 group-hover:bg-white text-gray-50 ease-linear duration-300 rounded-full border border-slate-200 group-hover:border-none p-1.5 rotate-45"
                    viewBox="0 0 16 19"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                        className="fill-slate-800 group-hover:fill-[#2c258e]"
                    />
                </svg>
            )}
        </button>
    );
}

export default Button;
