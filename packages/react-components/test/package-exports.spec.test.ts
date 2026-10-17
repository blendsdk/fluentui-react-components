import { describe, expect, it } from 'vitest';
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
  LoadingProps,
  SystemErrorProviderProps,
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
      'ConfirmDialog',
      'ConfirmProvider',
      'DescriptionList',
      'DescriptionListItem',
      'ErrorDialog',
      'Loading',
      'SystemErrorProvider',
      'useConfirm',
      'useSystemError',
    ]);
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
});
