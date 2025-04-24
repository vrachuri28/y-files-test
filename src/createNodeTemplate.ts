import {STATUS_MAP} from './config';
import {ConditionType, NodeTag, ZoomDetail} from './interfaces';
import {getTextContent, getTextEllipsisWrap} from './utils';
import {nodeConstants, svgNS} from './constants';
import {StatusEnum, statusStringMapping} from 'api/Constants';
import i18next from 'i18next';

const nodeWidth = `${nodeConstants.width}px`;
const nodeHeight = `${nodeConstants.height}px`;
const groupPadding = 10;

export interface GroupNodeProps {
  isGroup: boolean;
  isGroupCollapsed: boolean;
  groupToggle: () => void;
  width: number;
  height: number;
}

export interface ConditionNodeProps {
  isCondition?: boolean;
  conditionType?: ConditionType;
}

// Create a node template using SVG
export function createNodeTemplate(tag: NodeTag, zoom: ZoomDetail, group: GroupNodeProps) {
  // Create SVG element
  let svg = document.createElementNS(svgNS, 'g');
  if (group.isGroup && !group.isGroupCollapsed) {
    const borderRect = document.createElementNS(svgNS, 'rect');
    borderRect.setAttribute('x', `-${groupPadding}`);
    borderRect.setAttribute('y', `-${groupPadding}`);
    borderRect.setAttribute('width', `${group.width + groupPadding * 2}`);
    borderRect.setAttribute('height', `${group.height + groupPadding * 2}`);
    borderRect.setAttribute('rx', '8');
    borderRect.setAttribute('ry', '8');
    borderRect.setAttribute('stroke', '#3273D94D');
    borderRect.setAttribute('stroke-width', '5');
    borderRect.setAttribute('fill', '#3273D90A');
    borderRect.setAttribute('class', 'group-border');
    svg.appendChild(borderRect);
    createBoxNodeHeader(svg, tag, group);
  } else {
    switch (zoom) {
      case 'sm':
        svg = createNodeS(svg, tag);
        break;
      case 'md':
        svg = createNodeM(svg, tag);
        break;
      case 'lg':
        svg = createNodeL(svg, tag);
        break;
      case 'xl':
        svg = createNodeXL(svg, tag);
        break;
    }
  }

  if (group.isGroup) {
    // Review: Consider zoom levels when taking the size and position of the button.
    const buttonContainer = document.createElementNS(svgNS, 'g');
    buttonContainer.setAttribute('id', 'box-node-toggle-button');
    buttonContainer.setAttribute('transform', `translate(${group.width - 25},${group.height - 20})`);

    // register a native click listener on the SVG element
    buttonContainer.addEventListener('click', group.groupToggle);
    // pointerdown causes the capturing of subsequent pointer events, thus we need to disable
    // pointerdown on the current element such that the native click event is triggered furthermore
    // this causes the input mode should to not handle any event on the button where we registered
    // a native click listener
    buttonContainer.addEventListener('pointerdown', e => e.preventDefault());

    // Define button dimensions based on zoom level
    const getButtonDimensions = () => {
      return {width: '45', height: '40', scale: 1.5};
    };

    const {width, height, scale} = getButtonDimensions();

    // Create the white rectangle with blue stroke
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', '1');
    rect.setAttribute('y', '1');
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', 'white');
    rect.setAttribute('stroke', '#3272D9');
    rect.setAttribute('stroke-width', '2');

    // Create the path
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute(
      'd',
      group.isGroupCollapsed
        ? 'M9.3092 19.5374L14.0129 14.8337L15.1667 15.9875L10.463 20.6912L12.5893 20.6711C13.0356 20.6668 13.394 21.0252 13.3897 21.4714C13.3855 21.9177 13.0203 22.2829 12.574 22.2872L7.66675 22.3337L7.71325 17.4264C7.71748 16.9801 8.08269 16.6149 8.52896 16.6107C8.97523 16.6064 9.33358 16.9648 9.32935 17.4111L9.3092 19.5374ZM22.691 8.46329L17.9873 13.167L16.8334 12.0131L21.5371 7.30945L19.4108 7.3296C18.9645 7.33383 18.6062 6.97548 18.6104 6.52921C18.6147 6.08293 18.9799 5.71773 19.4261 5.7135L24.3334 5.66699L24.2869 10.5743C24.2827 11.0205 23.9175 11.3858 23.4712 11.39C23.0249 11.3942 22.6666 11.0359 22.6708 10.5896L22.691 8.46329Z'
        : 'M23.1795 5.6665L18.4758 10.3702L18.4959 8.24391C18.5002 7.79764 18.1418 7.43929 17.6956 7.44352C17.2493 7.44775 16.8841 7.81295 16.8798 8.25923L16.8333 13.1665L21.7406 13.12C22.1869 13.1158 22.5521 12.7506 22.5563 12.3043C22.5606 11.858 22.2022 11.4997 21.7559 11.5039L19.6296 11.524L24.3333 6.82035L23.1795 5.6665ZM8.82052 22.3332L13.5242 17.6295L13.5041 19.7558C13.4998 20.202 13.8582 20.5604 14.3045 20.5562C14.7507 20.5519 15.1159 20.1867 15.1202 19.7404L15.1667 14.8332L10.2594 14.8797C9.81312 14.8839 9.44791 15.2491 9.44368 15.6954C9.43946 16.1417 9.7978 16.5 10.2441 16.4958L12.3704 16.4756L7.66667 21.1793L8.82052 22.3332Z',
    );

    path.setAttribute('fill', '#3272D9');
    path.setAttribute('transform', `scale(${scale})`);
    // Append elements to the container
    buttonContainer.appendChild(rect);
    buttonContainer.appendChild(path);
    svg.appendChild(buttonContainer);
  }

  return svg;
}

//settings/configuration svg icon
function createResourceIcon(badgeSize: number, iconColor = '#171D26', scaleFactor = 4.39, canTransform = true): SVGGElement {
  const iconOffsetX = (badgeSize - 36 * scaleFactor) / 2;
  const iconOffsetY = (badgeSize - 34 * scaleFactor) / 2;

  const badgeIconGroup = document.createElementNS(svgNS, 'g');
  if (canTransform) {
    badgeIconGroup.setAttribute('transform', `translate(${iconOffsetX}, ${iconOffsetY}) scale(${scaleFactor})`);
  }

  const badgePath = document.createElementNS(svgNS, 'path');
  badgePath.setAttribute('fill-rule', 'evenodd');
  badgePath.setAttribute('clip-rule', 'evenodd');
  badgePath.setAttribute(
    'd',
    'M14.0674 17C14.0674 17.3151 14.1032 17.6216 14.1708 17.9157L13.268 18.5662C13.0356 18.7043 12.9571 19.0121 13.0927 19.2537L13.6757 20.293C13.8113 20.5346 14.1097 20.6186 14.3421 20.4805L15.3687 19.9741C15.7906 20.3608 16.2953 20.6557 16.8525 20.828L16.9521 22C16.9521 22.2761 17.1719 22.5 17.4431 22.5H18.6093C18.8805 22.5 19.1003 22.2761 19.1003 22L19.1889 20.8121C19.7274 20.6374 20.2156 20.3477 20.6255 19.9712L21.6579 20.4805C21.8903 20.6186 22.1887 20.5346 22.3243 20.293L22.9073 19.2537C23.0429 19.0121 22.9644 18.7043 22.732 18.5662L21.8215 17.9101C21.8883 17.6177 21.9236 17.3131 21.9236 17C21.9236 16.7024 21.8917 16.4124 21.8312 16.1334L22.7582 15.4805C22.9906 15.3424 23.0691 15.0346 22.9335 14.793L22.3505 13.7537C22.2149 13.5121 21.9165 13.4281 21.6841 13.5662L20.6577 14.0587C20.2413 13.6677 19.7416 13.3672 19.1889 13.1879L19.1003 12C19.1003 11.7239 18.8805 11.5 18.6093 11.5H17.4431C17.1719 11.5 16.9521 11.7239 16.9521 12L16.8525 13.172C16.2811 13.3487 15.7648 13.6544 15.3364 14.0558L14.3159 13.5662C14.0835 13.4281 13.7851 13.5121 13.6495 13.7537L13.0665 14.793C12.9309 15.0346 13.0094 15.3424 13.2418 15.4805L14.161 16.1279C14.0997 16.4086 14.0674 16.7005 14.0674 17ZM19.7723 17.0039C19.7723 18.001 18.9785 18.8093 17.9993 18.8093C17.0202 18.8093 16.2264 18.001 16.2264 17.0039C16.2264 16.0068 17.0202 15.1985 17.9993 15.1985C18.9785 15.1985 19.7723 16.0068 19.7723 17.0039Z',
  );
  badgePath.setAttribute('fill', iconColor);

  badgeIconGroup.appendChild(badgePath);

  return badgeIconGroup;
}

function createGlobeIcon(badgeSize: number, iconColor = '#171D26', scaleFactor = 4.39, canTransform = true): SVGGElement {
  const originalWidth = 13;
  const originalHeight = 12;

  const iconOffsetX = (badgeSize - originalWidth * scaleFactor) / 2;
  const iconOffsetY = (badgeSize - originalHeight * scaleFactor) / 2;
  // const iconOffsetX = (badgeSize - 36 * scaleFactor) / 2;
  // const iconOffsetY = (badgeSize - 36 * scaleFactor) / 2;

  const group = document.createElementNS(svgNS, 'g');
  if (canTransform) {
    group.setAttribute('transform', `translate(${iconOffsetX}, ${iconOffsetY}) scale(${scaleFactor})`);
  }

  const svgString = `
    <g clip-path="url(#clip0_1860_5407)">
    <g opacity="0.8">
    <path d="M4.65392 1.84198C4.60274 1.86322 4.55204 1.88538 4.50184 1.90843L4.65392 1.84198Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M2.34551 3.99999C2.80283 3.07973 3.56592 2.33824 4.50184 1.90843C4.2795 2.50545 4.11147 3.21575 4.00609 3.99999H2.34551Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M2.26135 4.17916L2.34551 3.99999C2.31619 4.05899 2.28812 4.11872 2.26135 4.17916Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M1.98925 6.99999C1.91628 6.67837 1.87775 6.34368 1.87775 5.99999C1.87775 5.68932 1.90923 5.38602 1.96917 5.09308L1.98925 4.99999H3.90859C3.88819 5.32538 3.87775 5.65948 3.87775 5.99999C3.87775 6.34049 3.88819 6.67459 3.90859 6.99999H1.98925Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M4.50184 10.0915C4.2795 9.49452 4.11147 8.78422 4.00609 7.99999L2.34578 8.00053C2.80314 8.92053 3.5661 9.66182 4.50184 10.0915Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M4.50184 10.0915C4.55204 10.1146 4.60274 10.1368 4.65392 10.158L4.50184 10.0915Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M8.10156 1.84198L8.25364 1.90843C8.20344 1.88538 8.15274 1.86322 8.10156 1.84198Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M8.25364 1.90843C9.24957 2.3658 10.0498 3.17609 10.4941 4.17916L10.41 3.99999H8.74939C8.64401 3.21575 8.47598 2.50545 8.25364 1.90843Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M10.6552 4.5986L10.7136 4.7915C10.6956 4.7266 10.6761 4.66229 10.6552 4.5986Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M10.4097 8.00053L8.74939 7.99999C8.64401 8.78422 8.47598 9.49452 8.25364 10.0915L8.10156 10.158C8.15274 10.1368 8.20344 10.1146 8.25364 10.0915C9.18938 9.66182 9.95234 8.92053 10.4097 8.00053Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M10.7662 4.99999H8.84689C8.86729 5.32538 8.87773 5.65948 8.87773 5.99999C8.87773 6.34049 8.86729 6.67459 8.84689 6.99999H10.7662C10.8392 6.67831 10.8777 6.34365 10.8777 5.99999C10.8777 5.65629 10.8392 5.3216 10.7662 4.99999Z" fill="${iconColor}" fill-opacity="0.62"/>
    </g>
    <path d="M5.7562 10.4565C5.45269 9.93275 5.18042 9.06407 5.02209 8H7.7334C7.57498 9.06472 7.30247 9.93381 6.99919 10.4574C6.79606 10.4855 6.58859 10.5 6.37775 10.5C6.1669 10.5 5.95944 10.4855 5.7562 10.4565Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M4.87775 6C4.87775 5.65724 4.8901 5.32285 4.91306 5H7.84243C7.86539 5.32285 7.87775 5.65724 7.87775 6C7.87775 6.34276 7.86539 6.67715 7.84243 7H4.91306C4.8901 6.67715 4.87775 6.34276 4.87775 6Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path d="M5.75631 1.54256C5.95944 1.5145 6.1669 1.5 6.37775 1.5C6.58859 1.5 6.79606 1.5145 6.99929 1.54346C7.3028 2.06725 7.57508 2.93593 7.7334 4H5.02209C5.18051 2.93528 5.45303 2.06619 5.75631 1.54256Z" fill="${iconColor}" fill-opacity="0.62"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.8777 6C10.8777 3.51472 8.86303 1.5 6.37775 1.5C3.89247 1.5 1.87775 3.51472 1.87775 6C1.87775 8.48528 3.89247 10.5 6.37775 10.5C8.86303 10.5 10.8777 8.48528 10.8777 6ZM11.8777 6C11.8777 2.96243 9.41531 0.5 6.37775 0.5C3.34018 0.5 0.877747 2.96243 0.877747 6C0.877747 9.03757 3.34018 11.5 6.37775 11.5C9.41531 11.5 11.8777 9.03757 11.8777 6Z" fill="${iconColor}" fill-opacity="0.62"/>
    </g>
    <defs>
    <clipPath id="clip0_1860_5407">
    <rect width="12" height="12" fill="white" transform="translate(0.377747)"/>
    </clipPath>
    </defs>
  `;

  group.innerHTML = svgString;

  return group;
}

function createWhiteBlueBadgeIcon(badgeSize: number, iconColor = '#5691F0'): SVGGElement {
  const svgNS = 'http://www.w3.org/2000/svg';

  // **Badge Size Scaling**
  const outerSize = badgeSize * 0.75; // White Circle (e.g., 88 for badgeSize 100)
  const innerSize = outerSize - 75; // Blue Circle (e.g., 50)

  const badgeGroup = document.createElementNS(svgNS, 'g');
  badgeGroup.setAttribute('filter', 'url(#filter0_ddd_1816_3329)');

  // **White Outer Circle**
  const outerCircle = document.createElementNS(svgNS, 'rect');
  outerCircle.setAttribute('x', `${-outerSize / 2}`); // Centering
  outerCircle.setAttribute('y', `${-outerSize / 2}`);
  outerCircle.setAttribute('width', `${outerSize}`);
  outerCircle.setAttribute('height', `${outerSize}`);
  outerCircle.setAttribute('rx', `${outerSize / 2}`);
  outerCircle.setAttribute('fill', 'white');
  outerCircle.setAttribute('shape-rendering', 'crispEdges');
  outerCircle.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

  badgeGroup.appendChild(outerCircle);

  // **Blue Inner Circle**
  const innerCircle = document.createElementNS(svgNS, 'rect');
  innerCircle.setAttribute('x', `${-innerSize / 2}`);
  innerCircle.setAttribute('y', `${-innerSize / 2}`);
  innerCircle.setAttribute('width', `${innerSize}`);
  innerCircle.setAttribute('height', `${innerSize}`);
  innerCircle.setAttribute('rx', `${innerSize / 2}`);
  innerCircle.setAttribute('fill', iconColor);

  badgeGroup.appendChild(innerCircle);

  return badgeGroup;
}

function createDoubleIconBadge(badgeSize: number, icon1: SVGGElement, icon2: SVGGElement, xAlignment = 128, zoom: ZoomDetail): SVGGElement {
  const svgNS = 'http://www.w3.org/2000/svg';

  // **Badge dimensions**
  const badgeScale = badgeSize * 0.5263;
  const outerWidth = badgeScale; // Badge width
  const outerHeight = badgeScale * 0.55; // Badge height

  // **Badge group**
  const badgeGroup = document.createElementNS(svgNS, 'g');
  badgeGroup.setAttribute('filter', 'url(#filter0_ddd_1816_3329)');

  // **Outer white badge shape**
  const outerBadge = document.createElementNS(svgNS, 'rect');
  outerBadge.setAttribute('x', `${xAlignment}`);
  outerBadge.setAttribute('y', `${-outerHeight * (zoom === 'xl' ? 0.65 : 0.6)}`);
  outerBadge.setAttribute('width', `${outerWidth}`);
  outerBadge.setAttribute('height', `${outerHeight}`);
  outerBadge.setAttribute('rx', `${outerHeight / 2}`); // Rounded shape
  outerBadge.setAttribute('fill', 'white');
  outerBadge.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

  badgeGroup.appendChild(outerBadge);

  // **Centering & Scaling Icons inside the badge**
  const iconScale = (outerHeight * 0.6) / 12; // Scale based on badge size
  const iconXalignment = zoom === 'xl' ? 186 : zoom === 'lg' ? 160 : xAlignment + 16;
  const iconXalignment2 = zoom === 'xl' ? iconXalignment + 7 : iconXalignment + 10;
  const iconYalignment = zoom === 'xl' ? -(outerHeight * 0.6) + 5 : -(outerHeight * 0.6) + (zoom === 'lg' ? 10 : 11);
  const iconYalignment2 = zoom === 'xl' ? -(outerHeight + outerHeight * 0.06) + 2 : -(outerHeight + outerHeight * 0.06) + (zoom === 'lg' ? 5 : 4);

  icon1.setAttribute('transform', `translate(${iconXalignment}, ${iconYalignment}) scale(${iconScale})`);
  icon2.setAttribute('transform', `translate(${iconXalignment2}, ${iconYalignment2}) scale(${iconScale})`);

  // **Append both icons to badge**
  badgeGroup.appendChild(icon1);
  badgeGroup.appendChild(icon2);

  return badgeGroup;
}

function createNodeS(svg: SVGGElement, tag: NodeTag) {
  const statusObj = STATUS_MAP[tag.status];

  // Use your exact node dimensions
  const width = nodeConstants.width; // e.g., 226
  const height = nodeConstants.height; // e.g., 239

  // --- Create the group ---
  const group = document.createElementNS(svgNS, 'g');

  // --- Create the first rectangle (background) ---
  const background = document.createElementNS(svgNS, 'rect');

  background.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

  background.setAttribute('x', '0'); // No offset
  background.setAttribute('y', '0');
  background.setAttribute('width', `${width}`);
  background.setAttribute('height', `${height}`);
  background.setAttribute('rx', '50'); // Adjusted corner radius
  background.setAttribute('fill', statusObj.category.colors.bgColor.sm);

  if (tag.status === statusStringMapping[StatusEnum.RUNNING]) {
    createProgressIndicator(svg, 0, 'sm', 20);
  } else {
    background.setAttribute('stroke', statusObj.category.colors.line);
    background.setAttribute('stroke-opacity', '1');
    background.setAttribute('stroke-width', '20');
  }

  group.appendChild(background);

  if (tag.has_resources || tag.has_global_variable) {
    const badge = createWhiteBlueBadgeIcon(width); // 88px badge by default
    badge.setAttribute('transform', `translate(${width}, 0)`);
    group.appendChild(badge);
  }

  // Append the group to the SVG
  svg.appendChild(group);

  return svg;
}

function createNodeM(svg: SVGGElement, tag: NodeTag) {
  const statusObj = STATUS_MAP[tag.status];

  const width = nodeConstants.width;
  const height = nodeConstants.height;

  // --- Create the main group ---
  const group = document.createElementNS(svgNS, 'g');

  // --- Background Rectangle ---
  const background = document.createElementNS(svgNS, 'rect');
  background.setAttribute('width', `${width}`);
  background.setAttribute('height', `${height}`);
  background.setAttribute('rx', '50');
  background.setAttribute('fill', statusObj.category.colors.bgColor.md);
  background.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

  group.appendChild(background);

  // === EXISTING ICON (Centered) ===
  const iconGroup = document.createElementNS(svgNS, 'g');

  if (statusObj.category.icon?.svgPath) {
    iconGroup.setAttribute('fill', statusObj.category.colors.icon.fill);

    const targetIconSize = nodeConstants.width / 4;
    const scale = targetIconSize / 9; // Fixed scale to fit correctly

    const centerX = nodeConstants.width / 2 - 9;
    const centerY = nodeConstants.height / 2 - 13;

    const offsetX = centerX - 10 * scale;
    const offsetY = centerY - 10 * scale;

    // const scaleFactor = 0.6316; // 63.16%
    // iconGroup.setAttribute('transform', `scale(${scaleFactor})`);

    iconGroup.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);
    iconGroup.innerHTML = statusObj.category.icon.svgPath;
  }
  group.appendChild(iconGroup);

  if (tag.status === statusStringMapping[StatusEnum.RUNNING]) {
    createProgressIndicator(svg, 0, 'md');
  }

  const badgeSize = width * 0.5263 * 0.55; // White circle size80
  if (tag.has_global_variable && tag.has_resources) {
    const globeIcon = createGlobeIcon(badgeSize, '#171D26'); // Scale down the globe
    const resourceIcon = createResourceIcon(badgeSize, '#3272D9'); // Scale down the resource icon
    const doubleIconBadge = createDoubleIconBadge(width, globeIcon, resourceIcon, 128, 'md');
    group.appendChild(doubleIconBadge);
  } else if (tag.has_global_variable || tag.has_resources) {
    const badgeGroup = document.createElementNS(svgNS, 'g');
    badgeGroup.setAttribute('transform', `translate(${width - badgeSize * 0.5}, ${-badgeSize * 0.5})`);

    const whiteCircle = document.createElementNS(svgNS, 'rect');
    whiteCircle.setAttribute('x', '0');
    whiteCircle.setAttribute('y', '0');
    whiteCircle.setAttribute('width', `${badgeSize}`);
    whiteCircle.setAttribute('height', `${badgeSize}`);
    whiteCircle.setAttribute('rx', `${badgeSize / 2}`);
    whiteCircle.setAttribute('fill', 'white');
    badgeGroup.appendChild(whiteCircle);
    badgeGroup.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

    let badgeIcon: SVGGElement;
    if (tag.has_global_variable) {
      badgeIcon = createGlobeIcon(badgeSize, '#171D26', 3.5);
      badgeGroup.appendChild(badgeIcon);
      group.appendChild(badgeGroup);
    } else if (tag.has_resources) {
      badgeIcon = createResourceIcon(badgeSize, '#3272D9', 3.5);
      badgeGroup.appendChild(badgeIcon);
      group.appendChild(badgeGroup);
    }
  }

  // Append everything to the SVG
  svg.appendChild(group);

  return svg;
}

function createNodeL(svg: SVGGElement, tag: NodeTag) {
  const statusObj = STATUS_MAP[tag.status];

  const paddingX = 16;
  const paddingY = 16;
  const width = nodeConstants.width;
  const height = nodeConstants.height;

  // 1) Create the background rectangle
  const background = document.createElementNS(svgNS, 'rect');
  background.setAttribute('width', `${width}`);
  background.setAttribute('height', `${height}`);
  background.setAttribute('rx', '8');
  background.setAttribute('ry', '8');
  background.setAttribute('class', 'node-background');
  background.setAttribute('fill', statusObj.category.colors.bgColor.lg);
  background.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';
  svg.appendChild(background);

  // 2) Create the header section
  const headerGroup = document.createElementNS(svgNS, 'g');
  headerGroup.setAttribute('transform', `translate(${paddingX},${12})`);

  // 3) Create the status icon group
  const iconGroup = document.createElementNS(svgNS, 'g');

  if (statusObj.category.icon?.svgPath) {
    iconGroup.setAttribute('fill', statusObj.category.colors.icon.fill);
    const scaleFactor = 2;
    iconGroup.setAttribute('transform', `scale(${scaleFactor})`);
    iconGroup.innerHTML = statusObj.category.icon.svgPath.trim();
  }

  headerGroup.appendChild(iconGroup);

  if (tag.job_type) {
    const jobTypeText = document.createElementNS(svgNS, 'text');

    jobTypeText.setAttribute('x', `${nodeConstants.width - paddingX * 2}`);
    jobTypeText.setAttribute('y', `${paddingY}`);
    jobTypeText.setAttribute('text-anchor', 'end');
    jobTypeText.setAttribute('font-size', '20px');
    jobTypeText.setAttribute('font-weight', '600');
    jobTypeText.textContent = tag.job_type.toUpperCase();

    getTextEllipsisWrap(jobTypeText, 150, 20, 16, nodeConstants.width - paddingX * 2);

    headerGroup.appendChild(jobTypeText);
  }

  svg.appendChild(headerGroup);

  if (tag.status === statusStringMapping[StatusEnum.RUNNING]) {
    createProgressIndicator(svg, nodeConstants.height - 5, 'lg');
  }

  // 5) Create the label text with ellipsis wrap
  const labelText = document.createElementNS(svgNS, 'text');
  labelText.setAttribute('transform', `translate(${paddingX}, 56)`);
  labelText.setAttribute('fill', '#171D26DE');
  labelText.setAttribute('font-size', '28px');
  labelText.setAttribute('font-weight', '600');
  labelText.textContent = tag.label;

  getTextEllipsisWrap(labelText, nodeConstants.width - 44, tag.unknown ? 72 : nodeConstants.height - 100, 36);

  // Review: Check with Jinto about the design of the icon placement. Ideally should be on the right of the header.
  if (tag.unknown) {
    const iconGroup = document.createElementNS(svgNS, 'g');
    iconGroup.setAttribute('transform', `translate(${nodeConstants.width / 2 - 30}, 150) scale(1.5, 1.5)`);
    iconGroup.innerHTML = `<g opacity="0.6">
    <path d="M4.39039 16.6667C5.82959 18.9739 11.6644 20.706 18.6691 20.734C18.4886 21.3612 18.3776 22.0173 18.3388 22.6982C18.2394 24.4385 19.4977 25.9615 21.2255 26.1922L23.3313 26.4734C23.3157 26.5093 23.3003 26.5452 23.2853 26.5813C21.8827 26.7467 20.39 26.8359 18.8417 26.8359C10.6724 26.8359 4.04999 24.3525 4.04999 21.2891C4.04999 21.2272 4.05269 21.1656 4.05805 21.1042H4.04999V18.1458H4.08714C4.06251 18.0237 4.04999 17.9004 4.04999 17.776C4.04999 17.3953 4.16745 17.0241 4.39039 16.6667Z" fill="#171D26" fill-opacity="0.62"/>
    <path d="M22.6484 29.3689L22.6234 35.4606C21.4163 35.5799 20.1488 35.6435 18.8417 35.6435C10.8374 35.6435 4.31813 33.2594 4.05805 30.2815H4.04999V26.5836H4.05925C4.09423 26.2347 4.22784 25.8947 4.45061 25.5667C5.99895 27.8463 11.8545 29.5419 18.8417 29.5419C20.1578 29.5419 21.4338 29.4818 22.6484 29.3689Z" fill="#171D26" fill-opacity="0.62"/>
    </g>
    <path opacity="0.8" d="M33.6333 8.35886H33.6241C33.3459 5.58527 26.834 3.36667 18.8417 3.36667C10.8493 3.36667 4.33742 5.58527 4.05925 8.35886H4.04999V12.0568H4.05805C4.05269 12.1182 4.04999 12.1798 4.04999 12.2417C4.04999 15.3051 10.6724 17.7885 18.8417 17.7885C19.1512 17.7885 19.4586 17.785 19.7634 17.7779C20.1294 17.23 20.5627 16.7172 21.0608 16.2435C22.8351 14.5562 25.0848 13.8333 27.4778 13.8333C29.059 13.8333 30.5879 14.1293 31.9608 14.8063C33.0292 14.0393 33.6333 13.1669 33.6333 12.2417C33.6333 12.1798 33.6306 12.1182 33.6253 12.0568H33.6333V8.35886Z" fill="#171D26" fill-opacity="0.62"/>
    <path d="M28.8197 30.3346C28.8049 29.4114 28.877 28.7707 29.036 28.4125C29.1949 28.0544 29.6034 27.5808 30.2614 26.9919C31.5331 25.8538 32.363 24.9544 32.7511 24.2938C33.1393 23.6332 33.3333 22.9329 33.3333 22.1927C33.3333 20.8556 32.8047 19.6837 31.7475 18.6769C30.6902 17.6701 29.267 17.1667 27.4778 17.1667C25.7774 17.1667 24.4041 17.6641 23.3579 18.659C22.3117 19.6538 21.748 20.8636 21.6667 22.2882L24.5279 22.6702C24.7275 21.6754 25.0935 20.9352 25.6258 20.4497C26.1581 19.9642 26.8198 19.7215 27.6109 19.7215C28.4316 19.7215 29.084 19.9543 29.5683 20.4199C30.0526 20.8855 30.2947 21.4446 30.2947 22.0972C30.2947 22.5668 30.1579 22.9965 29.8844 23.3865C29.7069 23.6332 29.1635 24.1545 28.2541 24.9504C27.3447 25.7463 26.7385 26.4626 26.4354 27.0993C26.1322 27.736 25.9807 28.5478 25.9807 29.5347C25.9807 29.6303 25.9844 29.8969 25.9918 30.3346H28.8197ZM25.9568 35.5H29.0731V32.4056H25.9568V35.5Z" fill="#171D26" fill-opacity="0.62"/>
    `;

    svg.appendChild(iconGroup);
  }

  svg.appendChild(labelText);

  const badgeSize = width * 0.2263;

  const badgeGroup = document.createElementNS(svgNS, 'g');
  badgeGroup.setAttribute('transform', `translate(${width - badgeSize * 0.5}, ${-height * 0.15})`);

  if (tag.has_global_variable && tag.has_resources) {
    // **Circle Sizes**
    const globeIcon = createGlobeIcon(badgeSize, '#171D26', 3.25); // Scale down the globe
    const resourceIcon = createResourceIcon(badgeSize, '#3272D9', 3.75); // Scale down the resource icon
    const doubleIconBadge = createDoubleIconBadge(width * 0.8, globeIcon, resourceIcon, 148, 'lg');

    svg.appendChild(doubleIconBadge);
  } else if (tag.has_global_variable || tag.has_resources) {
    let badgeIcon: SVGGElement;
    const whiteCircle = document.createElementNS(svgNS, 'rect');
    whiteCircle.setAttribute('x', '0');
    whiteCircle.setAttribute('y', '0');
    whiteCircle.setAttribute('width', `${badgeSize}`);
    whiteCircle.setAttribute('height', `${badgeSize}`);
    whiteCircle.setAttribute('rx', `${badgeSize / 2}`);
    whiteCircle.setAttribute('fill', 'white');
    badgeGroup.appendChild(whiteCircle);
    badgeGroup.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

    if (tag.has_global_variable) {
      badgeIcon = createGlobeIcon(badgeSize, '#171D26', 2.5);
      badgeGroup.appendChild(badgeIcon);
      svg.appendChild(badgeGroup);
    } else if (tag.has_resources) {
      badgeIcon = createResourceIcon(badgeSize, '#3272D9', 2.5);
      badgeGroup.appendChild(badgeIcon);
      svg.appendChild(badgeGroup);
    }
  }

  return svg;
}

function createNodeXL(svg: SVGGElement, tag: NodeTag) {
  const statusObj = STATUS_MAP[tag.status];

  const paddingX = 12;
  const paddingY = 12;

  // Background rectangle
  const background = document.createElementNS(svgNS, 'rect');
  background.setAttribute('width', nodeWidth);
  background.setAttribute('height', nodeHeight);
  background.setAttribute('rx', '8');
  background.setAttribute('ry', '8');
  background.setAttribute('fill', '#fff');
  background.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';
  svg.appendChild(background);

  // Header section
  const headerGroupContainer = document.createElementNS(svgNS, 'g');
  const headerGroup = document.createElementNS(svgNS, 'g');
  headerGroup.setAttribute('transform', `translate(${paddingX},${8})`);

  const width = nodeConstants.width; // e.g., 226
  // const height = nodeConstants.height; // e.g., 239

  // Header background
  const headerBg = document.createElementNS(svgNS, 'rect');
  headerBg.setAttribute('width', nodeWidth);
  headerBg.setAttribute('height', '77');
  headerBg.setAttribute('fill', statusObj.category.colors.bgColor.xl);
  headerBg.setAttribute('rx', '8');

  const headerBgCorners = document.createElementNS(svgNS, 'rect');
  headerBgCorners.setAttribute('y', '69');
  headerBgCorners.setAttribute('width', nodeWidth);
  headerBgCorners.setAttribute('height', '8');
  headerBgCorners.setAttribute('fill', statusObj.category.colors.bgColor.xl);

  headerGroupContainer.appendChild(headerBg);
  headerGroupContainer.appendChild(headerBgCorners);

  // Status Icon
  const iconGroup = document.createElementNS(svgNS, 'g');

  if (statusObj.category.icon?.svgPath) {
    iconGroup.setAttribute('fill', statusObj.category.colors.icon.fill);

    const scaleFactor = 1; // Scale factor
    iconGroup.setAttribute('transform', `scale(${scaleFactor})`);

    iconGroup.innerHTML = statusObj.category.icon.svgPath.trim();
  }

  // Create animated rectangles
  // const rect1 = createAnimatedRect("100", "-140", "400", "140", "360");
  // const rect2 = createAnimatedRect("320", "-400", "428", "320", "40", "1.15s");

  // // Append to SVG
  // svg.appendChild(rect1);
  // svg.appendChild(rect2);

  // // Append SVG to the body or another container
  // document.body.appendChild(svg);
  // headerGroup.appendChild(svg)

  headerGroup.appendChild(iconGroup);

  // Status Text
  const statusText = document.createElementNS(svgNS, 'text');
  statusText.setAttribute('x', '30');
  statusText.setAttribute('y', `${paddingY + 4}`);
  statusText.setAttribute('font-size', '12px');
  statusText.setAttribute('fill', '#171D26DE');
  statusText.textContent = statusObj.label;

  headerGroup.appendChild(statusText);

  if (tag.job_type) {
    const jobTypeText = document.createElementNS(svgNS, 'text');

    jobTypeText.setAttribute('x', `${nodeConstants.width - paddingX * 2}`);
    jobTypeText.setAttribute('y', '0');
    jobTypeText.setAttribute('fill', '#171D26DE');
    jobTypeText.setAttribute('text-anchor', 'end');
    jobTypeText.setAttribute('font-size', '12px');
    jobTypeText.textContent = tag.job_type.toUpperCase();

    getTextEllipsisWrap(jobTypeText, 200, 20, 16, nodeConstants.width - paddingX * 2);

    headerGroup.appendChild(jobTypeText);
  }

  // Title Text
  const titleText = document.createElementNS(svgNS, 'text');
  titleText.setAttribute('x', `${paddingX}`);
  titleText.setAttribute('y', '24');
  titleText.setAttribute('fill', '#171D26DE');
  titleText.setAttribute('font-size', '14px');
  titleText.setAttribute('font-weight', '600');
  titleText.textContent = tag.label;

  getTextEllipsisWrap(titleText, nodeConstants.width - 24, 50, 16);
  headerGroup.appendChild(titleText);

  headerGroupContainer.appendChild(headerGroup);
  svg.appendChild(headerGroupContainer);

  if (tag.status === statusStringMapping[StatusEnum.RUNNING]) {
    createProgressIndicator(svg, 77, 'xl');
  }

  // Content Section
  const contentGroup = document.createElementNS(svgNS, 'g');
  contentGroup.setAttribute('transform', `translate(${paddingX}, ${77 + paddingY})`);

  if (tag.unknown) {
    const iconGroup = document.createElementNS(svgNS, 'g');
    iconGroup.setAttribute('transform', `translate(${nodeConstants.width / 2 - 30}, 35)`);
    iconGroup.innerHTML = `<g opacity="0.6">
    <path d="M4.39039 16.6667C5.82959 18.9739 11.6644 20.706 18.6691 20.734C18.4886 21.3612 18.3776 22.0173 18.3388 22.6982C18.2394 24.4385 19.4977 25.9615 21.2255 26.1922L23.3313 26.4734C23.3157 26.5093 23.3003 26.5452 23.2853 26.5813C21.8827 26.7467 20.39 26.8359 18.8417 26.8359C10.6724 26.8359 4.04999 24.3525 4.04999 21.2891C4.04999 21.2272 4.05269 21.1656 4.05805 21.1042H4.04999V18.1458H4.08714C4.06251 18.0237 4.04999 17.9004 4.04999 17.776C4.04999 17.3953 4.16745 17.0241 4.39039 16.6667Z" fill="#171D26" fill-opacity="0.62"/>
    <path d="M22.6484 29.3689L22.6234 35.4606C21.4163 35.5799 20.1488 35.6435 18.8417 35.6435C10.8374 35.6435 4.31813 33.2594 4.05805 30.2815H4.04999V26.5836H4.05925C4.09423 26.2347 4.22784 25.8947 4.45061 25.5667C5.99895 27.8463 11.8545 29.5419 18.8417 29.5419C20.1578 29.5419 21.4338 29.4818 22.6484 29.3689Z" fill="#171D26" fill-opacity="0.62"/>
    </g>
    <path opacity="0.8" d="M33.6333 8.35886H33.6241C33.3459 5.58527 26.834 3.36667 18.8417 3.36667C10.8493 3.36667 4.33742 5.58527 4.05925 8.35886H4.04999V12.0568H4.05805C4.05269 12.1182 4.04999 12.1798 4.04999 12.2417C4.04999 15.3051 10.6724 17.7885 18.8417 17.7885C19.1512 17.7885 19.4586 17.785 19.7634 17.7779C20.1294 17.23 20.5627 16.7172 21.0608 16.2435C22.8351 14.5562 25.0848 13.8333 27.4778 13.8333C29.059 13.8333 30.5879 14.1293 31.9608 14.8063C33.0292 14.0393 33.6333 13.1669 33.6333 12.2417C33.6333 12.1798 33.6306 12.1182 33.6253 12.0568H33.6333V8.35886Z" fill="#171D26" fill-opacity="0.62"/>
    <path d="M28.8197 30.3346C28.8049 29.4114 28.877 28.7707 29.036 28.4125C29.1949 28.0544 29.6034 27.5808 30.2614 26.9919C31.5331 25.8538 32.363 24.9544 32.7511 24.2938C33.1393 23.6332 33.3333 22.9329 33.3333 22.1927C33.3333 20.8556 32.8047 19.6837 31.7475 18.6769C30.6902 17.6701 29.267 17.1667 27.4778 17.1667C25.7774 17.1667 24.4041 17.6641 23.3579 18.659C22.3117 19.6538 21.748 20.8636 21.6667 22.2882L24.5279 22.6702C24.7275 21.6754 25.0935 20.9352 25.6258 20.4497C26.1581 19.9642 26.8198 19.7215 27.6109 19.7215C28.4316 19.7215 29.084 19.9543 29.5683 20.4199C30.0526 20.8855 30.2947 21.4446 30.2947 22.0972C30.2947 22.5668 30.1579 22.9965 29.8844 23.3865C29.7069 23.6332 29.1635 24.1545 28.2541 24.9504C27.3447 25.7463 26.7385 26.4626 26.4354 27.0993C26.1322 27.736 25.9807 28.5478 25.9807 29.5347C25.9807 29.6303 25.9844 29.8969 25.9918 30.3346H28.8197ZM25.9568 35.5H29.0731V32.4056H25.9568V35.5Z" fill="#171D26" fill-opacity="0.62"/>
    `;
    contentGroup.appendChild(iconGroup);

    const unknownText = document.createElementNS(svgNS, 'text');
    unknownText.setAttribute('x', `${nodeConstants.width / 2 - 10}`);
    unknownText.setAttribute('y', `${90}`);
    unknownText.setAttribute('fill', '#171D26DE');
    unknownText.setAttribute('font-size', '13px');
    unknownText.setAttribute('font-weight', '500');
    unknownText.setAttribute('text-anchor', 'middle');
    unknownText.textContent = `This job's details are restricted`;
    contentGroup.appendChild(unknownText);

    svg.appendChild(contentGroup);
  } else {
    // Data rows (will be populated dynamically)
    // Review: Translation & values from the tag
    const dataFields = ['start_time', 'end_time', 'duration', 'run_machine', 'ntry', 'exit_code'];
    const boxFields = ['start_time', 'end_time', 'duration', 'ntry', 'exit_code'];

    const lineHeight = tag.job_type === 'box' ? 30 : 24;
    const labelWidth = 70;

    [...(tag.job_type === 'box' ? boxFields : dataFields)].forEach((field, index) => {
      // Field label
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', '0');
      label.setAttribute('y', String(index * lineHeight));
      label.setAttribute('font-size', '12px');
      label.setAttribute('font-weight', '600');
      label.textContent = i18next.t(`view_flow.labels.${field}`);

      // Review: Check labelWidth
      getTextEllipsisWrap(label, 80, 20, paddingY);

      contentGroup.appendChild(label);

      const valueWidth = nodeConstants.width - paddingX * 3 - labelWidth;
      // Field value
      const value = document.createElementNS(svgNS, 'text');
      value.setAttribute('x', valueWidth.toString());
      value.setAttribute('y', String(index * lineHeight));
      value.setAttribute('font-size', '12px');
      value.textContent = getTextContent(tag[field as keyof typeof tag] as string);

      getTextEllipsisWrap(value, valueWidth, paddingY, paddingY, labelWidth + paddingX * 2);

      contentGroup.appendChild(value);
    });

    svg.appendChild(contentGroup);

    const badgeSize = width * 0.1263; // White circle size80
    if (tag.has_global_variable && tag.has_resources) {
      const globeIcon = createGlobeIcon(badgeSize, '#171D26', 2.25); // Scale down the globe
      const resourceIcon = createResourceIcon(badgeSize, '#3272D9', 2.25); // Scale down the resource icon
      const doubleIconBadge = createDoubleIconBadge(width * 0.5, globeIcon, resourceIcon, 180, 'xl');
      svg.appendChild(doubleIconBadge);
    } else if (tag.has_global_variable || tag.has_resources) {
      const badgeGroup = document.createElementNS(svgNS, 'g');
      badgeGroup.setAttribute('transform', `translate(${width - badgeSize * 0.5}, ${-badgeSize * 0.5})`);

      const whiteCircle = document.createElementNS(svgNS, 'rect');
      whiteCircle.setAttribute('x', '0');
      whiteCircle.setAttribute('y', '0');
      whiteCircle.setAttribute('width', `${badgeSize}`);
      whiteCircle.setAttribute('height', `${badgeSize}`);
      whiteCircle.setAttribute('rx', `${badgeSize / 2}`);
      whiteCircle.setAttribute('fill', 'white');
      badgeGroup.appendChild(whiteCircle);
      badgeGroup.style.filter = 'drop-shadow(#0000001F 0px 1px 8px) drop-shadow(#00000024 0px 3px 4px) drop-shadow(#00000033 0px 3px 3px)';

      let badgeIcon: SVGGElement;
      if (tag.has_global_variable) {
        badgeIcon = createGlobeIcon(badgeSize, '#171D26', 1.5);
        badgeGroup.appendChild(badgeIcon);
        svg.appendChild(badgeGroup);
      } else if (tag.has_resources) {
        badgeIcon = createResourceIcon(badgeSize, '#3272D9', 1.5);
        badgeGroup.appendChild(badgeIcon);
        svg.appendChild(badgeGroup);
      }
    }
  }

  return svg;
}

export function createConditionNode(conditionType: ConditionType) {
  const svg = document.createElementNS(svgNS, 'g');
  const nodeSize = 100;
  const circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', `${nodeSize / 2}`);
  circle.setAttribute('cy', `${nodeSize / 2}`);
  circle.setAttribute('r', `${nodeSize / 2}`);
  circle.setAttribute('stroke', 'lightblue');
  circle.setAttribute('stroke-width', '4');
  circle.setAttribute('fill', 'white');

  // Create the ampersand text
  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('x', `${nodeSize / 2}`);
  text.setAttribute('y', `${nodeSize / 2}`);
  text.setAttribute('font-size', '28');
  text.setAttribute('font-weight', '600');
  text.setAttribute('fill', 'black');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('alignment-baseline', 'middle');
  text.textContent = conditionType === 'AND' ? '&' : '||';

  // Append elements
  svg.appendChild(circle);
  svg.appendChild(text);

  return svg;
}

function createBoxNodeHeader(svg: SVGGElement, tag: NodeTag, groupInfo: GroupNodeProps) {
  const statusObj = STATUS_MAP[tag.status];

  const group = document.createElementNS(svgNS, 'g');
  group.setAttribute('width', `${groupInfo.width}`);
  group.setAttribute('height', '57');
  group.setAttribute('fill', 'none');

  // Background rectangle
  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('width', `${groupInfo.width + 4 + groupPadding * 2}`);
  rect.setAttribute('height', '57');
  rect.setAttribute('fill', statusObj.category.colors.bgColor.lg);
  rect.setAttribute('y', '-60');
  rect.setAttribute('x', '-12');
  group.appendChild(rect);

  const iconGroup = document.createElementNS(svgNS, 'g');
  iconGroup.setAttribute('transform', 'translate(0, -55)');

  if (statusObj.category.icon?.svgPath) {
    iconGroup.setAttribute('fill', statusObj.category.colors.icon.fill);
    iconGroup.setAttribute('transform', 'translate(0, -55) scale(1)');
    iconGroup.innerHTML = statusObj.category.icon.svgPath.trim();
  }

  group.appendChild(iconGroup);

  // Status text
  const statusText = document.createElementNS(svgNS, 'text');
  statusText.setAttribute('x', '30');
  statusText.setAttribute('y', '-40');
  statusText.setAttribute('fill', '#171D26');
  statusText.setAttribute('font-size', '11');
  statusText.setAttribute('fill-opacity', '0.87');
  statusText.textContent = statusObj.label;
  group.appendChild(statusText);

  // Additional elements for box
  const boxGroup = document.createElementNS(svgNS, 'g');
  boxGroup.setAttribute('clip-path', 'url(#clip0_1850_2538)');
  boxGroup.setAttribute('width', '16');
  boxGroup.setAttribute('height', '17');
  boxGroup.setAttribute('fill', 'none');
  boxGroup.setAttribute('opacity', '0.6');

  const boxText = document.createElementNS(svgNS, 'text');
  boxText.setAttribute('x', `${groupInfo.width - 40}`);
  boxText.setAttribute('y', '-40');
  boxText.setAttribute('fill', '#171D26');
  boxText.setAttribute('fill-opacity', '0.87');
  boxText.setAttribute('font-size', '11');
  boxText.setAttribute('font-family', 'Arial');
  boxText.textContent = 'BOX';
  boxGroup.appendChild(boxText);

  group.appendChild(boxGroup);

  // Job text
  const jobText = document.createElementNS(svgNS, 'text');
  jobText.setAttribute('x', '8');
  jobText.setAttribute('y', '-30');
  jobText.setAttribute('font-family', 'Arial');
  jobText.setAttribute('font-size', '14');
  jobText.setAttribute('fill', 'black');
  jobText.textContent = tag.label;
  getTextEllipsisWrap(jobText, groupInfo.width - 10, 12, 16, 8);
  group.appendChild(jobText);

  // Append group to SVG
  svg.appendChild(group);

  if (tag.status === statusStringMapping[StatusEnum.RUNNING]) {
    createProgressIndicator(svg, -3, 'lg', 10, groupInfo.width);
  }
}

function createProgressIndicator(svg: SVGGElement, yOffset = 0, zoomDetail: ZoomDetail, strokeWidth = 10, boxWidth = nodeConstants.width) {
  const progressBar = document.createElementNS(svgNS, 'g');

  if (zoomDetail === 'md' || zoomDetail === 'sm') {
    const spinningBorder = document.createElementNS(svgNS, 'rect');
    spinningBorder.setAttribute('x', '0');
    spinningBorder.setAttribute('y', '0');
    spinningBorder.setAttribute('width', `${nodeConstants.width}`);
    spinningBorder.setAttribute('height', `${nodeConstants.height}`);
    spinningBorder.setAttribute('rx', '50');
    spinningBorder.setAttribute('fill', 'none');
    spinningBorder.setAttribute('stroke', '#1D5BBF');
    spinningBorder.setAttribute('stroke-width', `${strokeWidth}`);
    spinningBorder.setAttribute('stroke-dasharray', '400');
    spinningBorder.setAttribute('stroke-dashoffset', '800');

    const spinningBorderAnimation = document.createElementNS(svgNS, 'animate');
    spinningBorderAnimation.setAttribute('attributeName', 'stroke-dashoffset');
    spinningBorderAnimation.setAttribute('from', '800');
    spinningBorderAnimation.setAttribute('to', '0');
    spinningBorderAnimation.setAttribute('dur', '2s');
    spinningBorderAnimation.setAttribute('repeatCount', 'indefinite');

    spinningBorder.appendChild(spinningBorderAnimation);

    progressBar.appendChild(spinningBorder);
  } else {
    progressBar.setAttribute('transform', `translate(0, ${yOffset})`);

    const clipPath = document.createElementNS(svgNS, 'defs');
    clipPath.innerHTML = `
    <clipPath id="progress-bar-clip">
        <rect x="0" y="0" width="${boxWidth}" height="5"/>
      </clipPath>
    `;

    progressBar.appendChild(clipPath);

    const backgroundBar = document.createElementNS(svgNS, 'rect');
    backgroundBar.setAttribute('x', '0');
    backgroundBar.setAttribute('y', '0');
    backgroundBar.setAttribute('width', `${boxWidth}`);
    backgroundBar.setAttribute('height', '5');
    backgroundBar.setAttribute('fill', '#F0F5FC');
    backgroundBar.setAttribute('rx', '2');
    backgroundBar.setAttribute('ry', '2');

    progressBar.appendChild(backgroundBar);

    const movingProgressGroup = document.createElementNS(svgNS, 'g');
    movingProgressGroup.setAttribute('clip-path', 'url(#progress-bar-clip)');

    const movingBarWidth = boxWidth > 226 ? boxWidth / 5 : 50;

    const movingProgressBar = document.createElementNS(svgNS, 'rect');
    movingProgressBar.setAttribute('x', '0');
    movingProgressBar.setAttribute('y', '0');
    movingProgressBar.setAttribute('width', `${movingBarWidth}`);
    movingProgressBar.setAttribute('height', '5');
    movingProgressBar.setAttribute('fill', '#1D5BBF');
    movingProgressBar.setAttribute('rx', '2');
    movingProgressBar.setAttribute('ry', '2');

    const progressAnimation = document.createElementNS(svgNS, 'animateTransform');
    progressAnimation.setAttribute('attributeType', 'XML');
    progressAnimation.setAttribute('attributeName', 'transform');
    progressAnimation.setAttribute('type', 'translate');
    progressAnimation.setAttribute('from', '-50 0');
    progressAnimation.setAttribute('to', `${boxWidth} 0`);
    progressAnimation.setAttribute('dur', '1.5s');
    progressAnimation.setAttribute('repeatCount', 'indefinite');

    movingProgressBar.appendChild(progressAnimation);

    movingProgressGroup.appendChild(movingProgressBar);
    progressBar.appendChild(movingProgressGroup);
  }

  svg.appendChild(progressBar);
}
/**
 * Utility function to create and manage icons and badges based on zoom level.
 */
export function createBadgeIcon(
  badgeType: 'resource' | 'globe' | 'whiteBlue' | 'double',
  badgeSize: number,
  iconColor1?: string,
  iconColor2?: string,
  zoom?: ZoomDetail,
  xAlignment?: number,
): SVGGElement | null {
  switch (badgeType) {
    case 'resource':
      return createResourceIcon(badgeSize, iconColor1, undefined, false);
    case 'globe':
      return createGlobeIcon(badgeSize, iconColor1, undefined, false);
    case 'whiteBlue':
      return createWhiteBlueBadgeIcon(badgeSize, iconColor1);
    case 'double': {
      if (!iconColor1 || !iconColor2 || !zoom || !xAlignment) {
        return null;
      }
      const globeIcon = createGlobeIcon(badgeSize, iconColor1, zoom === 'xl' ? 2.25 : zoom === 'lg' ? 3.25 : 3.5, false);
      const resourceIcon = createResourceIcon(badgeSize, iconColor2, zoom === 'xl' ? 2.25 : zoom === 'lg' ? 3.75 : 3.5, false);
      return createDoubleIconBadge(badgeSize, globeIcon, resourceIcon, xAlignment, zoom);
    }
    default:
      return null;
  }
}
