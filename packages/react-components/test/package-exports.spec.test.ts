import { describe, expect, it } from 'vitest';
import { createElement, createRef } from 'react';
import type { Control } from 'react-hook-form';
import * as api from '../src/index';
import type {
  AppLauncherDocking,
  AppLauncherGridProps,
  AppLauncherItemProps,
  AppLauncherListProps,
  AppLauncherProps,
  AppLauncherSearchChangeData,
  AppLauncherSearchProps,
  AppLauncherSectionProps,
  AppLauncherTriggerProps,
  CatchErrorOptions,
  CollapsibleSectionProps,
  ConfirmAction,
  ConfirmDialogProps,
  ConfirmDialogStrings,
  ConfirmIntent,
  ConfirmOptions,
  ConfirmOptionsWithActions,
  ConfirmProviderProps,
  ErrorDialogKind,
  ErrorDialogProps,
  ErrorDialogStrings,
  FormCheckboxFieldProps,
  FormComboboxFieldProps,
  FormDatePickerFieldProps,
  FormDropdownFieldProps,
  FormRadioGroupFieldProps,
  FormSwitchFieldProps,
  FormTextFieldProps,
  FormTextareaFieldProps,
  LoadingController,
  LoadingOptions,
  LoadingOverlayProps,
  LoadingProps,
  SystemErrorProviderProps,
  TileGridAction,
  TileGridDragHandleProps,
  TileGridHandle,
  TileGridInteractionMode,
  TileGridItemProps,
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridProps,
  TileGridReorderArgs,
  TileGridSelectionMode,
  TileGridStrings,
} from '../src/index';

describe('package export surface', () => {
  it('exposes exactly the documented component exports', () => {
    // Consumers import from the package root, so the runtime surface is part
    // of the contract: every documented component is reachable and no
    // internal module leaks out.
    expect(Object.keys(api).sort()).toEqual([
      'AppLauncher',
      'AppLauncherGrid',
      'AppLauncherItem',
      'AppLauncherList',
      'AppLauncherSearch',
      'AppLauncherSection',
      'AppLauncherTrigger',
      'CollapsibleSection',
      'ConfirmDialog',
      'ConfirmProvider',
      'DescriptionList',
      'DescriptionListItem',
      'ErrorDialog',
      'FormCheckboxField',
      'FormComboboxField',
      'FormDatePickerField',
      'FormDropdownField',
      'FormRadioGroupField',
      'FormSwitchField',
      'FormTextField',
      'FormTextareaField',
      'Loading',
      'LoadingOverlay',
      'SystemErrorProvider',
      'TileGrid',
      'TileGridItem',
      'useConfirm',
      'useLoading',
      'useSystemError',
    ]);
  });

  it('exports CollapsibleSection props with rich content, all sizes and heading levels, and a div ref', () => {
    // Public props accept React content and native div events without reducing title to a string.
    const props: CollapsibleSectionProps = {
      title: createElement('strong', null, 'Details'),
      children: createElement('p', null, 'Content'),
      actions: createElement('button', { type: 'button' }, 'Edit'),
      collapsed: false,
      defaultCollapsed: true,
      onCollapsedChange: collapsed => {
        const requested: boolean = collapsed;
        expect(typeof requested).toBe('boolean');
      },
      id: 'section-root',
      'aria-label': 'Detail card',
      className: 'caller-class',
      style: { maxWidth: '420px' },
      onClick: event => {
        const root: HTMLDivElement = event.currentTarget;
        root.dataset.clicked = 'true';
      },
    };
    const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
    const sizePins: CollapsibleSectionProps[] = sizes.map(size => ({ ...props, size }));
    const levels = [2, 3, 4, 5, 6] as const;
    const headingPins: CollapsibleSectionProps[] = levels.map(headingLevel => ({
      ...props,
      headingLevel,
    }));

    // The component, rather than its standalone props type, accepts the forwarded root ref.
    const ref = createRef<HTMLDivElement>();
    const element = createElement(api.CollapsibleSection, { ...props, ref });
    expect(element.type).toBe(api.CollapsibleSection);
    expect(element.props.ref).toBe(ref);
    expect(element.props.title).toBe(props.title);
    expect(element.props.children).toBe(props.children);
    expect(element.props.actions).toBe(props.actions);
    expect(sizePins.map(pin => pin.size)).toEqual(['small', 'medium', 'large', 'extra-large']);
    expect(headingPins.map(pin => pin.headingLevel)).toEqual([2, 3, 4, 5, 6]);
  });

  it('rejects unsupported disclosure headings, sizes, appearance and raw HTML', () => {
    // Compile-time failures keep unsupported customization and HTML parsing out of the contract.
    const props: CollapsibleSectionProps = { title: 'Details', children: 'Content' };
    const headingPin: CollapsibleSectionProps = {
      ...props,
      // @ts-expect-error Disclosure headings support levels two through six only.
      headingLevel: 1,
    };
    const sizePin: CollapsibleSectionProps = {
      ...props,
      // @ts-expect-error Only the four documented header sizes are accepted.
      size: 'extra-small',
    };
    const appearancePin: CollapsibleSectionProps = {
      ...props,
      // @ts-expect-error The card appearance is fixed rather than a caller option.
      appearance: 'outline',
    };
    const htmlPin: CollapsibleSectionProps = {
      ...props,
      // @ts-expect-error Structured children cannot be replaced with raw HTML.
      dangerouslySetInnerHTML: { __html: '<b>Content</b>' },
    };

    expect([headingPin, sizePin, appearancePin, htmlPin]).toHaveLength(4);
  });

  it('exports the public TileGrid and TileGridItem types', () => {
    // The imports above only compile when the package root exports them; the
    // values keep the file local-usage clean under noUnusedLocals.
    interface Photo {
      id: string;
      label: string;
    }

    const action: TileGridAction<Photo> = {
      id: 'open',
      label: 'Open',
      onSelect: () => {},
    };
    const handle: TileGridHandle = {
      selectAll: () => {},
      clearSelection: () => {},
      scrollToSelected: () => {},
    };
    const handleProps: TileGridDragHandleProps = {
      setNodeRef: () => {},
      attributes: {},
      listeners: {},
      isDragging: false,
      disabled: false,
      label: 'Reorder A',
    };
    const reorder: TileGridReorderArgs = {
      itemId: 'a',
      fromIndex: 0,
      toIndex: 1,
      orderedIds: ['b', 'a'],
    };
    const strings: TileGridStrings = {
      emptyMessage: 'No photos',
      selectionCount: (selected, total) => `${selected} of ${total} selected`,
      dragHandleLabel: label => `Reorder ${label}`,
      moveUp: 'Move up',
      moveDown: 'Move down',
      reorderPosition: (position, total) => `Position ${position} of ${total}`,
      moreActions: 'More actions',
    };
    const renderArgs: TileGridItemRenderArgs<Photo> = {
      item: { id: 'a', label: 'A' },
      index: 0,
      tileSize: 160,
      width: 160,
      height: 160,
      selected: false,
      selectable: true,
      disabled: false,
      isDragging: false,
      isOverlay: false,
      dragHandleProps: handleProps,
      reorderActions: [action],
      strings,
    };
    const layout = 'masonry' satisfies TileGridLayout;
    const selectionMode = 'multiselect' satisfies TileGridSelectionMode;
    const interactionMode = 'browse' satisfies TileGridInteractionMode;
    const gridProps: TileGridProps<Photo> = {
      items: [renderArgs.item],
      getItemId: item => item.id,
      getItemLabel: item => item.label,
      renderItem: () => null,
      layout,
      selectionMode,
      interactionMode,
      strings,
    };
    const itemProps: TileGridItemProps<Photo> = {
      item: renderArgs.item,
      title: 'A',
      actions: [action],
      dragHandleProps: handleProps,
      reorderActions: [action],
      strings,
    };
    const wrongItemProps: TileGridItemProps<Photo> = {
      // @ts-expect-error The item must match the declared item type.
      item: { id: 'video-1', duration: 4 },
    };

    expect(action.id).toBe('open');
    expect(handle).toBeDefined();
    expect(handleProps.label).toBe('Reorder A');
    expect(reorder.toIndex).toBe(1);
    expect(strings.moreActions).toBe('More actions');
    expect(renderArgs.tileSize).toBe(160);
    expect(layout).toBe('masonry');
    expect(selectionMode).toBe('multiselect');
    expect(interactionMode).toBe('browse');
    expect(gridProps.items).toHaveLength(1);
    expect(itemProps.title).toBe('A');
    expect(wrongItemProps).toBeDefined();
  });

  it('exports the public ErrorDialog types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const kind = 'error' satisfies ErrorDialogKind;
    const partialStrings: Pick<ErrorDialogStrings, 'title'> = { title: 'Application error' };
    const dialogProps: ErrorDialogProps = { open: true, onDismiss: () => {} };

    expect(kind).toBe('error');
    expect(partialStrings.title).toBe('Application error');
    expect(dialogProps.open).toBe(true);
  });

  it('exports the public provider types', () => {
    // Both type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const options: CatchErrorOptions = { kind: 'error', detailsText: 'Support case 4711' };
    const providerProps: SystemErrorProviderProps = {
      captureGlobalErrors: false,
      children: null,
    };

    expect(options.kind).toBe('error');
    expect(providerProps.captureGlobalErrors).toBe(false);
  });

  it('exports the public ConfirmDialog types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const intent = 'danger' satisfies ConfirmIntent;
    const action = { value: 'save', label: 'Save' } satisfies ConfirmAction;
    const strings: ConfirmDialogStrings = { confirm: 'Delete', decline: 'Cancel' };
    const dialogProps: ConfirmDialogProps = {
      open: true,
      title: 'Delete this record?',
      onResolve: () => {},
    };

    expect(intent).toBe('danger');
    expect(action.value).toBe('save');
    expect(strings.confirm).toBe('Delete');
    expect(dialogProps.open).toBe(true);
  });

  it('exports the public ConfirmProvider types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const options: ConfirmOptions = { title: 'Delete this record?' };
    const actions = {
      title: 'Save your changes?',
      actions: [
        { value: 'cancel', label: 'Cancel' },
        { value: 'discard', label: 'Discard' },
        { value: 'save', label: 'Save' },
      ],
    } satisfies ConfirmOptionsWithActions<'cancel' | 'discard' | 'save'>;
    const providerProps: ConfirmProviderProps = {
      children: null,
      strings: { confirm: 'Yes', decline: 'No' },
    };

    expect(options.title).toBe('Delete this record?');
    expect(actions.actions).toHaveLength(3);
    expect(providerProps.strings?.confirm).toBe('Yes');
  });

  it('exports the public Loading types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const loadingProps: LoadingProps = { label: 'Loading records', delay: 300 };

    // The component owns the announcement attributes and the indicator, so
    // callers may not override them through the props type.
    // @ts-expect-error The status role is managed by the component.
    const rolePin: LoadingProps = { role: 'status' };
    // @ts-expect-error The live-region politeness is managed by the component.
    const livePin: LoadingProps = { 'aria-live': 'assertive' };
    // @ts-expect-error The live-region atomicity is managed by the component.
    const atomicPin: LoadingProps = { 'aria-atomic': 'false' };
    // @ts-expect-error The component owns its rendered content and never parses HTML.
    const htmlPin: LoadingProps = { dangerouslySetInnerHTML: { __html: '<b>busy</b>' } };

    expect(loadingProps.label).toBe('Loading records');
    expect([rolePin, livePin, atomicPin, htmlPin]).toHaveLength(4);
  });

  it('exports the public LoadingOverlay types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const overlayProps: LoadingOverlayProps = {
      loading: true,
      label: 'Saving…',
      delay: 0,
      children: null,
    };

    // The component owns the busy, announcement and focus contract and the
    // accessible name of its root, so callers may not override them.
    // @ts-expect-error The busy state is managed by the component.
    const busyPin: LoadingOverlayProps = { loading: true, children: null, 'aria-busy': 'false' };
    // @ts-expect-error The root name comes from the persistent status node.
    const labelPin: LoadingOverlayProps = { loading: true, children: null, 'aria-label': 'Busy' };
    const labelledByPin: LoadingOverlayProps = {
      loading: true,
      children: null,
      // @ts-expect-error The root name comes from the persistent status node.
      'aria-labelledby': 'somewhere',
    };
    const livePin: LoadingOverlayProps = {
      loading: true,
      children: null,
      // @ts-expect-error The live-region politeness is managed by the component.
      'aria-live': 'assertive',
    };
    const atomicPin: LoadingOverlayProps = {
      loading: true,
      children: null,
      // @ts-expect-error The live-region atomicity is managed by the component.
      'aria-atomic': 'false',
    };
    // @ts-expect-error The region role is managed by the component.
    const rolePin: LoadingOverlayProps = { loading: true, children: null, role: 'group' };
    // @ts-expect-error Inert is managed by the visibility state.
    const inertPin: LoadingOverlayProps = { loading: true, children: null, inert: true };
    // @ts-expect-error The focus target is managed by the component.
    const tabIndexPin: LoadingOverlayProps = { loading: true, children: null, tabIndex: 0 };
    const htmlPin: LoadingOverlayProps = {
      loading: true,
      children: null,
      // @ts-expect-error The component owns its rendered content and never parses HTML.
      dangerouslySetInnerHTML: { __html: '<b>busy</b>' },
    };

    expect(overlayProps.loading).toBe(true);
    expect([
      busyPin,
      labelPin,
      labelledByPin,
      livePin,
      atomicPin,
      rolePin,
      inertPin,
      tabIndexPin,
      htmlPin,
    ]).toHaveLength(9);
  });

  it('exports the public useLoading types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const options: LoadingOptions = { label: 'Working…' };

    async function runOperation<T>(operation: () => T | Promise<T>): Promise<T> {
      return operation();
    }

    const run: LoadingController['run'] = runOperation;
    const controller: LoadingController = { isLoading: false, label: undefined, run };

    expect(options.label).toBe('Working…');
    expect(controller.isLoading).toBe(false);
    expect(typeof controller.run).toBe('function');
  });

  it('exports the public AppLauncher block types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const gridProps: AppLauncherGridProps = { children: null, columns: 4 };
    const itemProps: AppLauncherItemProps = { label: 'Mail', disabledFocusable: true };
    const listProps: AppLauncherListProps = { children: null };
    const change: AppLauncherSearchChangeData = { value: 'mail' };
    const searchProps: AppLauncherSearchProps = { label: 'Search apps' };
    const sectionProps: AppLauncherSectionProps = {
      children: null,
      title: 'All apps',
      divider: true,
    };

    expect(gridProps.columns).toBe(4);
    expect(itemProps.disabledFocusable).toBe(true);
    expect(listProps.children).toBeNull();
    expect(change.value).toBe('mail');
    expect(searchProps.label).toBe('Search apps');
    expect(sectionProps.divider).toBe(true);
  });

  it('exports the public AppLauncher shell types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const docking = 'full' satisfies AppLauncherDocking;
    const launcherProps: AppLauncherProps = { children: null };
    const triggerProps: AppLauncherTriggerProps = { label: 'App launcher' };

    expect(docking).toBe('full');
    expect(launcherProps.children).toBeNull();
    expect(triggerProps.label).toBe('App launcher');
  });

  it('exports the public FormTextField type', () => {
    // The control is a typed stand-in: this test checks the exported props
    // types at compile time and never executes a form.
    type FormValues = { name: string; height?: number };
    const control = {} as Control<FormValues>;
    const textProps: FormTextFieldProps<FormValues, 'name'> = {
      control,
      name: 'name',
      label: 'Name',
    };
    const numberProps: FormTextFieldProps<FormValues, 'height'> = {
      control,
      name: 'height',
      label: 'Height',
      parse: value => (value === '' ? undefined : Number(value)),
    };

    type DateValues = { when: Date };
    const dateControl = {} as Control<DateValues>;
    // @ts-expect-error A Date path is not a text field.
    const dateProps: FormTextFieldProps<DateValues, 'when'> = {
      control: dateControl,
      name: 'when',
      label: 'When',
    };

    expect(textProps.label).toBe('Name');
    expect(numberProps.parse?.('42')).toBe(42);
    expect(dateProps.name).toBe('when');
  });

  it('exports the public FormTextareaField type', () => {
    type FormValues = { notes: string };
    const control = {} as Control<FormValues>;
    const props: FormTextareaFieldProps<FormValues, 'notes'> = {
      control,
      name: 'notes',
      label: 'Notes',
    };

    expect(props.label).toBe('Notes');
  });

  it('exports the public FormCheckboxField type', () => {
    type FormValues = { active: boolean; mixed?: 'mixed' };
    const control = {} as Control<FormValues>;
    const props: FormCheckboxFieldProps<FormValues, 'active'> = {
      control,
      name: 'active',
      label: 'Enable feature',
    };

    expect(props.label).toBe('Enable feature');
  });

  it('exports the public FormSwitchField type', () => {
    type FormValues = { enabled: boolean };
    const control = {} as Control<FormValues>;
    const props: FormSwitchFieldProps<FormValues, 'enabled'> = {
      control,
      name: 'enabled',
      label: 'Enable feature',
    };

    expect(props.label).toBe('Enable feature');
  });

  it('exports the public FormRadioGroupField type', () => {
    type FormValues = { plan: 'free' | 'pro' };
    const control = {} as Control<FormValues>;
    const props: FormRadioGroupFieldProps<FormValues, 'plan'> = {
      control,
      name: 'plan',
      label: 'Plan',
    };

    expect(props.label).toBe('Plan');
  });

  it('exports the public FormDropdownField type', () => {
    type FormValues = { color?: string };
    const control = {} as Control<FormValues>;
    const props: FormDropdownFieldProps<FormValues, 'color'> = {
      control,
      name: 'color',
      label: 'Color',
      getOptionText: value => value.toUpperCase(),
    };

    expect(props.getOptionText?.('blue')).toBe('BLUE');
  });

  it('exports the public FormComboboxField type', () => {
    type FormValues = { color?: string };
    const control = {} as Control<FormValues>;
    const props: FormComboboxFieldProps<FormValues, 'color'> = {
      control,
      name: 'color',
      label: 'Color',
      getOptionText: value => value.toUpperCase(),
    };

    expect(props.getOptionText?.('blue')).toBe('BLUE');
  });

  it('exports the public FormDatePickerField type', () => {
    type FormValues = { startDate?: Date | null };
    const control = {} as Control<FormValues>;
    const props: FormDatePickerFieldProps<FormValues, 'startDate'> = {
      control,
      name: 'startDate',
      label: 'Start date',
    };

    expect(props.label).toBe('Start date');
  });
});
