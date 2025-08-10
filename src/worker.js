self.onmessage = (event) => {
  const { data } = event;
  let value = data;
  if (data && typeof data === 'object' && 'value' in data) {
    value = data.value;
  }
  if (typeof value === 'number') {
    self.postMessage({ result: value * 2 });
  } else {
    self.postMessage({ error: 'Invalid input' });
  }
};
