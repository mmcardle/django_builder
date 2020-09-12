
const MAX_PROJECTS = 3;
const MAX_MODELS = 25;

// 500 is the max number of firebase transaction in a single batch.
// Lets be conservative here and do less in each batch
const MAX_BATCH_IMPORTABLE_MODELS = 450;

export {MAX_PROJECTS, MAX_MODELS, MAX_BATCH_IMPORTABLE_MODELS}
