const { resolvers } = require('../src/graphql/resolvers')

describe('Prefs resolvers', () => {
  test('setPrefs stores prefs via context', async () => {
    const ctx = { setPrefs: jest.fn() }
    const args = { categories: ['a'], locations: ['b'] }
    const res = await resolvers.Mutation.setPrefs(null, args, ctx)
    expect(ctx.setPrefs).toHaveBeenCalledWith(args)
    expect(res).toEqual(args)
  })

  test('prefs query returns context value', () => {
    const ctx = { prefs: { categories: ['a'], locations: ['b'] } }
    const res = resolvers.Query.prefs(null, null, ctx)
    expect(res).toEqual(ctx.prefs)
  })
})
