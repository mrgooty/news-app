describe('Simple Test Suite', () => {
  test('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
  });

  test('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });
}); 