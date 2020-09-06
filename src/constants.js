
const MAX_PROJECTS = 3

// 500 is the max number of firebase transaction in a single batch
// So we need 3 transactions for each model, so arounds 100 models can be imported in a single batch.
const MAX_BATCH_IMPORTABLE_MODELS = 100;

export {MAX_PROJECTS, MAX_BATCH_IMPORTABLE_MODELS}
