const keyByValue = function (arr, key) {
  return arr.reduce((associativeArr, item) => {
    associativeArr[item[key]] = item
    return associativeArr
  }, {})
}

export {keyByValue}
