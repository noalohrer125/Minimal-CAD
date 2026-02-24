// Minimal DOM-related test helpers for downloads and file input
// Provide jest declaration for TypeScript
declare const jest: any;

export const mockURL = (() => {
    const originalCreate = (globalThis as any).URL?.createObjectURL;
    const originalRevoke = (globalThis as any).URL?.revokeObjectURL;
    return {
        setup() {
            // simple stub that returns a fake object url
            (globalThis as any).URL = (globalThis as any).URL || {};
            (globalThis as any).URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake');
            (globalThis as any).URL.revokeObjectURL = jest.fn(() => undefined);
        },
        restore() {
            if (originalCreate) (globalThis as any).URL.createObjectURL = originalCreate;
            if (originalRevoke) (globalThis as any).URL.revokeObjectURL = originalRevoke;
        }
    };
})();

export function stubAnchorClick() {
    const a = { href: '', download: '', click: jest.fn() } as any;
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') return a;
        // fallback to a minimal input element for file uploads
        if (tagName === 'input') return { style: {}, type: 'file', click: jest.fn(), addEventListener: jest.fn(), remove: jest.fn() } as any;
        return originalCreateElement(tagName);
    });
    return a;
}

export function restoreCreateElementSpy() {
    jest.restoreAllMocks();
}
