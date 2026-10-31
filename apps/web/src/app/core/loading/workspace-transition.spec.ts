import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { WORKSPACE_PRELOAD, WorkspaceTransition } from './workspace-transition';

describe('WorkspaceTransition', () => {
  let preloaded: string[];

  function setUp(preload: (url: string) => Promise<unknown>): WorkspaceTransition {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: WORKSPACE_PRELOAD, useValue: preload }],
    });
    return TestBed.inject(WorkspaceTransition);
  }

  beforeEach(() => {
    preloaded = [];
  });

  it('shows the loading screen, prepares the workspace and navigates before hiding it', async () => {
    let release!: () => void;
    const transition = setUp((url) => {
      preloaded.push(url);
      return new Promise<void>((resolve) => (release = resolve));
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    const done = transition.enter('/trips');

    expect(transition.visible()).toBe(true);
    expect(transition.step()).toBe('screens');
    expect(preloaded).toEqual(['/trips']);
    expect(navigate).not.toHaveBeenCalled();

    release();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(transition.step()).toBe('opening');
    await done;

    expect(navigate).toHaveBeenCalledWith('/trips');
    expect(transition.visible()).toBe(false);
  });

  it('still enters when the preparation fails', async () => {
    const transition = setUp(() => Promise.reject(new Error('sin red')));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await transition.enter('/platform');

    expect(navigate).toHaveBeenCalledWith('/platform');
    expect(transition.visible()).toBe(false);
  });

  it('hides the loading screen when the navigation is rejected by a guard', async () => {
    const transition = setUp(() => Promise.resolve());
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);

    await transition.enter('/trips');

    expect(transition.visible()).toBe(false);
  });
});
