import { clsx } from '@a-type/ui';

export interface GameIllustration1Props {}

export function GameIllustration1({}: GameIllustration1Props) {
  const floatClass = `[animation-name:game-illustration-1-float] animate-iteration-count-infinite animate-duration-25s [animation-timing-function:linear]`;
  return (
    <div>
      <svg
        width="512"
        height="512"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
						@keyframes game-illustration-1-float {
							0%, 100% {
								transform: translateY(0);
							}
							50% {
								transform: translateY(40px);
							}
						}
					`}
        </style>
        <Grid />
        <g>
          <Pen className={clsx(floatClass, 'animate-delay-10s')} />
          <Crown className={clsx(floatClass, 'animate-delay-5s')} />
          <Stars className={clsx(floatClass, 'animate-duration-20s')} />
        </g>
        <defs>
          <filter
            id="filter0_d_1_6"
            x="46.0451"
            y="50.0451"
            width="420.209"
            height="420.209"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_6"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_6"
              result="shape"
            />
          </filter>
          <filter
            id="filter1_d_1_6"
            x="99.8288"
            y="163.572"
            width="246.296"
            height="226.706"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_6"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_6"
              result="shape"
            />
          </filter>
          <filter
            id="filter2_d_1_6"
            x="82.3813"
            y="89.3056"
            width="63.7863"
            height="218.896"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_6"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_6"
              result="shape"
            />
          </filter>
          <filter
            id="filter3_d_1_6"
            x="234.932"
            y="222.278"
            width="252.303"
            height="233.586"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_6"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_6"
              result="shape"
            />
          </filter>
          <filter
            id="filter4_d_1_6"
            x="267.086"
            y="31.1609"
            width="167.544"
            height="167.829"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_6"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_6"
              result="shape"
            />
          </filter>
          <filter
            id="filter5_d_1_6"
            x="79.5524"
            y="352.552"
            width="120.065"
            height="120.065"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_1_6"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_1_6"
              result="shape"
            />
          </filter>
          <clipPath id="clip0_1_6">
            <rect width="512" height="512" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Grid() {
  return (
    <g filter="url(#filter0_d_1_6)">
      <rect
        x="48.0001"
        y="186.467"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 48.0001 186.467)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="159.133"
        y="131.08"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 159.133 131.08)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="270.266"
        y="75.6934"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 270.266 75.6934)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="131.26"
        y="214.34"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 131.26 214.34)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="242.393"
        y="158.953"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 242.393 158.953)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="103.387"
        y="297.6"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 103.387 297.6)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="214.52"
        y="242.213"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 214.52 242.213)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="325.653"
        y="186.826"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 325.653 186.826)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="186.647"
        y="325.473"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 186.647 325.473)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="297.78"
        y="270.086"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 297.78 270.086)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="158.774"
        y="408.733"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 158.774 408.733)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="269.907"
        y="353.346"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 269.907 353.346)"
        fill="var(--color-gray-dark-blend)"
      />
      <rect
        x="381.04"
        y="297.959"
        width="62.0851"
        height="62.0851"
        rx="6"
        transform="rotate(-26.4909 381.04 297.959)"
        fill="var(--color-gray-dark-blend)"
      />
    </g>
  );
}

function Pen({ className }: { className: string }) {
  return (
    <g className={className}>
      <g filter="url(#filter1_d_1_6)">
        <path
          d="M336.623 206.415C320.94 144.75 199.601 160.2 220.858 246.823C242.115 333.446 152.474 270.753 184.83 349.202C217.186 427.65 91.97 315.781 111.381 296.35"
          stroke="var(--color-primary-dark)"
          strokeWidth="11"
          strokeLinecap="round"
        />
      </g>
      <g filter="url(#filter2_d_1_6)">
        <path
          d="M109.986 294.701L95.6378 258.967L91.8813 94.8056L136.668 96.3006L128.367 255.213L109.986 294.701Z"
          fill="var(--color-gray-dark-blend)"
        />
        <path
          d="M109.986 294.701L95.6378 258.967L91.8813 94.8056L136.668 96.3006L128.367 255.213L109.986 294.701Z"
          stroke="var(--color-primary-dark)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

function Crown({ className }: { className: string }) {
  return (
    <g filter="url(#filter3_d_1_6)" className={className}>
      <path
        d="M244.432 375.733L271.381 268.509C271.381 268.509 259.484 252.921 262.901 241.838C266.792 229.219 272.199 225.447 284.885 229.111C296.242 232.391 301.08 240.561 298.783 252.157C296.712 262.613 286.502 266.419 286.502 266.419L314.338 336.016L378.474 274.643C378.474 274.643 372.313 259.429 376.658 251.449C381.357 242.819 390.006 237.851 399.411 240.7C409.996 243.906 414.895 256.202 410.985 266.547C407.477 275.826 389.001 279.273 389.001 279.273L379.33 364.6L441.219 339.383C441.219 339.383 445.119 328.546 448.265 323.364C452.86 315.796 465.435 312.89 471.916 321.749C478.398 330.609 479.45 333.398 475.141 341.739C471.078 349.606 453.541 348.626 453.541 348.626L395.927 442.363L244.432 375.733Z"
        fill="var(--color-gray-dark-blend)"
      />
      <path
        d="M244.432 375.733L271.381 268.509C271.381 268.509 259.484 252.921 262.901 241.838C266.792 229.219 272.199 225.447 284.885 229.111C296.242 232.391 301.08 240.561 298.783 252.157C296.712 262.613 286.502 266.419 286.502 266.419L314.338 336.016L378.474 274.643C378.474 274.643 372.313 259.429 376.658 251.449C381.357 242.819 390.006 237.851 399.411 240.7C409.996 243.906 414.895 256.202 410.985 266.547C407.477 275.826 389.001 279.273 389.001 279.273L379.33 364.6L441.219 339.383C441.219 339.383 445.119 328.546 448.265 323.364C452.86 315.796 465.435 312.89 471.916 321.749C478.398 330.609 479.45 333.398 475.141 341.739C471.078 349.606 453.541 348.626 453.541 348.626L395.927 442.363L244.432 375.733Z"
        stroke="var(--color-primary-dark)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Stars({ className }: { className: string }) {
  return (
    <g className={className}>
      <g filter="url(#filter4_d_1_6)">
        <path
          d="M324.943 47.0648L356.462 78.9421C358.137 80.6364 360.713 81.0593 362.842 79.9895L402.899 59.8635L382.322 99.6908C381.229 101.808 381.622 104.388 383.298 106.082L414.817 137.96L370.58 130.697C368.229 130.311 365.897 131.483 364.803 133.6L344.226 173.427L337.463 129.111C337.104 126.756 335.269 124.9 332.917 124.514L288.681 117.251L328.738 97.1249C330.867 96.0551 332.065 93.7361 331.706 91.3806L324.943 47.0648Z"
          stroke="var(--color-primary-dark)"
          strokeWidth="11"
          strokeLinejoin="round"
          fill="var(--color-gray-dark-blend)"
        />
      </g>
      <g filter="url(#filter5_d_1_6)">
        <path
          d="M154.68 367.432L154.77 399.018C154.774 400.623 155.48 402.146 156.702 403.187L180.738 423.68L149.152 423.77C147.547 423.774 146.024 424.48 144.982 425.702L124.49 449.738L124.4 418.152C124.395 416.547 123.69 415.024 122.468 413.982L98.4316 393.49L130.018 393.4C131.623 393.395 133.146 392.69 134.187 391.468L154.68 367.432Z"
          stroke="var(--color-primary-dark)"
          strokeWidth="11"
          strokeLinejoin="round"
          fill="var(--color-gray-dark-blend)"
        />
      </g>
    </g>
  );
}
