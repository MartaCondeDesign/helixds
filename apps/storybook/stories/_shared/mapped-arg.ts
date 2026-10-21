// A story arg that names one of its control's `mapping` keys ('IconPlus', 'Search'…). Storybook swaps in
// the mapped value (the icon component, the slot element) before render, and the select control shows
// that name as chosen — passing the component itself renders the same but leaves the control blank.
export const mapped = (key: string) => key as never;
