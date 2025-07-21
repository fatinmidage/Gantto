/**
 * 菜单智能定位工具函数
 * 提供自适应边界检测和四象限定位策略
 */

export interface MenuDimensions {
  width: number;
  height: number;
}

export interface MenuPosition {
  x: number;
  y: number;
}

export interface SubmenuOffset {
  x: number;
  y: number;
}

/**
 * 计算菜单的智能定位
 * @param mousePosition 鼠标点击位置
 * @param menuDimensions 菜单尺寸
 * @param offset 可选偏移量
 * @returns 调整后的菜单位置
 */
export function calculateMenuPosition(
  mousePosition: MenuPosition,
  menuDimensions: MenuDimensions,
  offset: MenuPosition = { x: 0, y: 0 }
): MenuPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 10; // 距离边界的最小间距

  // 基础位置（鼠标位置 + 偏移）
  let x = mousePosition.x + offset.x;
  let y = mousePosition.y + offset.y;

  // 水平边界检测和调整
  if (x + menuDimensions.width + margin > viewportWidth) {
    // 右边界超出，向左调整
    x = mousePosition.x - menuDimensions.width - Math.abs(offset.x);
    
    // 如果向左调整后仍然超出左边界，则贴边显示
    if (x < margin) {
      x = viewportWidth - menuDimensions.width - margin;
    }
  }

  // 垂直边界检测和调整
  if (y + menuDimensions.height + margin > viewportHeight) {
    // 下边界超出，向上调整
    y = mousePosition.y - menuDimensions.height - Math.abs(offset.y);
    
    // 如果向上调整后仍然超出上边界，则贴边显示
    if (y < margin) {
      y = viewportHeight - menuDimensions.height - margin;
    }
  }

  // 确保坐标不为负数
  x = Math.max(margin, x);
  y = Math.max(margin, y);

  return { x, y };
}

/**
 * 计算二级菜单（子菜单）的智能定位
 * @param parentMenuPosition 父菜单位置
 * @param parentMenuDimensions 父菜单尺寸
 * @param submenuDimensions 子菜单尺寸
 * @param itemOffset 菜单项相对父菜单顶部的偏移
 * @returns 子菜单的最佳位置
 */
export function calculateSubmenuPosition(
  parentMenuPosition: MenuPosition,
  parentMenuDimensions: MenuDimensions,
  submenuDimensions: MenuDimensions,
  itemOffset: number = 0
): MenuPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 10;
  const overlap = 4; // 子菜单与父菜单的重叠像素

  // 默认位置：右侧展开，与触发项对齐
  let x = parentMenuPosition.x + parentMenuDimensions.width - overlap;
  let y = parentMenuPosition.y + itemOffset;

  // 水平边界检测
  if (x + submenuDimensions.width + margin > viewportWidth) {
    // 右侧空间不足，尝试左侧展开
    x = parentMenuPosition.x - submenuDimensions.width + overlap;
    
    // 如果左侧也不足，则使用最佳可用位置
    if (x < margin) {
      x = viewportWidth - submenuDimensions.width - margin;
    }
  }

  // 垂直边界检测
  if (y + submenuDimensions.height + margin > viewportHeight) {
    // 下方空间不足，向上对齐
    y = viewportHeight - submenuDimensions.height - margin;
  }

  // 确保不超出上边界
  y = Math.max(margin, y);

  return { x, y };
}

/**
 * 获取菜单的预估尺寸
 * @param itemCount 菜单项数量
 * @param hasInput 是否包含输入框
 * @param hasSubmenu 是否包含子菜单
 * @returns 菜单尺寸
 */
export function getEstimatedMenuDimensions(
  itemCount: number,
  hasInput: boolean = false,
  hasSubmenu: boolean = false
): MenuDimensions {
  const baseItemHeight = 44; // 基础菜单项高度
  const inputHeight = 80;    // 输入框区域高度
  const submenuHeight = 120; // 子菜单额外高度
  const padding = 16;        // 菜单内边距
  
  let height = padding * 2; // 上下内边距
  
  // 基础菜单项高度
  height += itemCount * baseItemHeight;
  
  // 输入框高度
  if (hasInput) {
    height += inputHeight;
  }
  
  // 子菜单高度
  if (hasSubmenu) {
    height += submenuHeight;
  }

  return {
    width: hasSubmenu ? 200 : 160, // 有子菜单时稍微宽一些
    height
  };
}

/**
 * 四象限定位策略
 * 根据鼠标在视口中的位置，选择最优的菜单显示象限
 * @param mousePosition 鼠标位置
 * @param menuDimensions 菜单尺寸
 * @returns 最优的菜单位置
 */
export function calculateQuadrantPosition(
  mousePosition: MenuPosition,
  menuDimensions: MenuDimensions
): MenuPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const margin = 10;

  // 确定鼠标所在象限
  const isRightSide = mousePosition.x > centerX;
  const isBottomSide = mousePosition.y > centerY;

  let x: number, y: number;

  if (!isRightSide && !isBottomSide) {
    // 第二象限 (左上) - 菜单显示在右下
    x = mousePosition.x;
    y = mousePosition.y;
  } else if (isRightSide && !isBottomSide) {
    // 第一象限 (右上) - 菜单显示在左下
    x = mousePosition.x - menuDimensions.width;
    y = mousePosition.y;
  } else if (!isRightSide && isBottomSide) {
    // 第三象限 (左下) - 菜单显示在右上
    x = mousePosition.x;
    y = mousePosition.y - menuDimensions.height;
  } else {
    // 第四象限 (右下) - 菜单显示在左上
    x = mousePosition.x - menuDimensions.width;
    y = mousePosition.y - menuDimensions.height;
  }

  // 边界修正
  x = Math.max(margin, Math.min(x, viewportWidth - menuDimensions.width - margin));
  y = Math.max(margin, Math.min(y, viewportHeight - menuDimensions.height - margin));

  return { x, y };
}

/**
 * 检查菜单是否会超出视口
 * @param position 菜单位置
 * @param dimensions 菜单尺寸
 * @returns 是否超出边界的检查结果
 */
export function checkMenuBounds(
  position: MenuPosition,
  dimensions: MenuDimensions
): {
  overflowRight: boolean;
  overflowBottom: boolean;
  overflowLeft: boolean;
  overflowTop: boolean;
} {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return {
    overflowRight: position.x + dimensions.width > viewportWidth,
    overflowBottom: position.y + dimensions.height > viewportHeight,
    overflowLeft: position.x < 0,
    overflowTop: position.y < 0
  };
}