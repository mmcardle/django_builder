const keyByValue = function (arr, key) {
  return arr.reduce((associativeArr, item) => {
    associativeArr[item[key]] = item
    return associativeArr
  }, {})
}


const batchModelsForTransaction = function ( models, limit) {
  console.log('batchModels', models)

  const batches = [];
  let num_in_current_array = 0;
  let current_array = [];

  models.forEach(model => {
    if ( num_in_current_array + 1 + model.fields.length + model.relationships.length > limit) {
      batches.push(current_array);
      current_array = [model];
      num_in_current_array = 1 + model.fields.length + model.relationships.length;
    } else {
      current_array.push(model)
      num_in_current_array += 1 + model.fields.length + model.relationships.length;
    }
  })

  batches.push(current_array);

  console.log('batches', batches.length, batches)

  return batches;
}


batchModelsForTransaction([
  {fields: [1,2], relationships: [1,2]},
  {fields: [1,2], relationships: [6,7]},
  {fields: [1,2,3,4], relationships: [6,7,8,9]},
  {fields: [1,2,3,4], relationships: [6,7,8,9]},
  {fields: [1,2,3,4], relationships: [6,7,8,9]},
  {fields: [1,2,3,4], relationships: [6,7,8,9]},
], 100)


export {keyByValue, batchModelsForTransaction}
