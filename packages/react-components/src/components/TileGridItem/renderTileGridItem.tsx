import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  mergeClasses,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  MoreHorizontalRegular,
  ReorderRegular,
} from '@fluentui/react-icons';
import { isValidElement } from 'react';
import type { ReactElement, Ref } from 'react';
import type { TileGridAction, TileGridDragHandleProps } from '../TileGrid/TileGrid.types';
import type { TileGridItemState } from './useTileGridItem';

/** Renders the default pointer-only drag handle. */
function DefaultDragHandle({
  handleProps,
  className,
}: {
  handleProps: TileGridDragHandleProps;
  className: string;
}): ReactElement {
  return (
    <Button
      {...handleProps.attributes}
      {...handleProps.listeners}
      ref={handleProps.setNodeRef}
      type="button"
      appearance="transparent"
      size="small"
      icon={<ReorderRegular />}
      tabIndex={-1}
      aria-label={handleProps.label.trim() || 'Reorder'}
      disabled={handleProps.disabled}
      data-tile-grid-drag-handle=""
      className={className}
    />
  );
}

/** Renders one inline action, choosing an icon button when an icon exists. */
function InlineAction<T>({
  action,
  label,
  intent,
  disabled,
  className,
  dangerClassName,
  item,
}: {
  action: TileGridAction<T>;
  label: string;
  intent: 'default' | 'danger';
  disabled: boolean;
  className: string;
  dangerClassName: string;
  item: T;
}): ReactElement {
  const iconElement = isValidElement(action.icon) ? action.icon : undefined;

  return (
    <Button
      type="button"
      appearance="transparent"
      size="small"
      icon={iconElement}
      aria-label={label}
      disabled={disabled}
      data-tile-grid-action-id={action.id}
      data-intent={intent}
      className={mergeClasses(className, intent === 'danger' && dangerClassName)}
      onClick={() => action.onSelect(item)}
    >
      {iconElement ? null : label}
    </Button>
  );
}

/**
 * Renders the optional tile shell inside its application-owned wrapper.
 *
 * The renderer is intentionally pure: all state, string defaults, and action
 * decisions arrive in `state`. Native attributes pass through first, then the
 * shell-owned state attributes are written so a caller cannot misrepresent a
 * disabled or overlay tile.
 */
export function renderTileGridItem<T>(
  state: TileGridItemState<T>,
  ref: Ref<HTMLDivElement>
): ReactElement {
  const { classes, resolved } = state;
  const mediaClasses = mergeClasses(
    classes.media,
    resolved.fit === 'contain' ? classes.mediaContain : classes.mediaCover
  );

  return (
    <div
      {...state.rootProps}
      ref={ref}
      data-tile-grid-item-shell=""
      data-selected={resolved.selected ? 'true' : undefined}
      data-disabled={resolved.disabled ? 'true' : undefined}
      data-dragging={resolved.isDragging ? 'true' : undefined}
      data-overlay={resolved.isOverlay ? 'true' : undefined}
      aria-disabled={resolved.disabled ? true : undefined}
      className={mergeClasses(
        classes.root,
        resolved.isDragging && !resolved.isOverlay && classes.dragging,
        resolved.isOverlay && classes.overlay,
        state.className
      )}
      style={state.style}
    >
      <div
        data-tile-grid-media=""
        data-fit={resolved.fit}
        className={mediaClasses}
        style={{ aspectRatio: resolved.aspectRatio }}
      >
        {state.media}
        {state.statusOverlay != null ? (
          <div data-tile-grid-status-overlay="" className={classes.statusOverlay}>
            {state.statusOverlay}
          </div>
        ) : null}
        {state.showSelection ? (
          <div
            data-tile-grid-selection-indicator=""
            aria-hidden="true"
            className={classes.selection}
          >
            {state.selectionIndicator ?? (
              <CheckmarkCircleFilled className={classes.selectionIcon} />
            )}
          </div>
        ) : null}
      </div>

      <div className={classes.content}>
        {state.title != null ? <div className={classes.title}>{state.title}</div> : null}
        {state.description != null ? (
          <div className={classes.description}>{state.description}</div>
        ) : null}
        {state.badges != null ? <div className={classes.badges}>{state.badges}</div> : null}
      </div>

      {state.inlineActions.length > 0 || state.showMenu ? (
        <div className={classes.actions}>
          {state.inlineActions.length > 0 ? (
            <div data-tile-grid-inline-actions="" className={classes.inlineActions}>
              {state.inlineActions.map((action, index) => (
                <InlineAction
                  key={`${action.id}-${index}`}
                  action={action}
                  label={state.labelFor(action)}
                  intent={state.intentFor(action)}
                  disabled={state.isActionDisabled(action)}
                  className={classes.action}
                  dangerClassName={classes.danger}
                  item={state.item}
                />
              ))}
            </div>
          ) : null}

          {state.showMenu ? (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  type="button"
                  appearance="transparent"
                  size="small"
                  icon={<MoreHorizontalRegular />}
                  aria-label={state.moreActionsLabel}
                  data-tile-grid-menu-trigger=""
                  className={classes.menuTrigger}
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {state.menuActions.map((action, index) => {
                    const intent = state.intentFor(action);
                    return (
                      <MenuItem
                        key={`${action.id}-${index}`}
                        icon={isValidElement(action.icon) ? action.icon : undefined}
                        disabled={state.isActionDisabled(action)}
                        data-tile-grid-action-id={action.id}
                        data-intent={intent}
                        className={intent === 'danger' ? classes.danger : undefined}
                        onClick={() => action.onSelect(state.item)}
                      >
                        {state.labelFor(action)}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </MenuPopover>
            </Menu>
          ) : null}
        </div>
      ) : null}

      {state.showHandle && state.handleProps ? (
        <div data-tile-grid-drag-handle-slot="" className={classes.handleSlot}>
          {state.dragHandle ? (
            state.dragHandle(state.handleProps)
          ) : (
            <DefaultDragHandle handleProps={state.handleProps} className={classes.handleButton} />
          )}
        </div>
      ) : null}
    </div>
  );
}
