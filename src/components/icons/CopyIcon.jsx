const CopyIcon = ({ className, size = 30, fill = "currentColor", ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g>
        <g>
          <path
            d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"
            fill={fill}
          />
        </g>
      </g>
    </svg>
  );
};

export default CopyIcon;