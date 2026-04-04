/**
 * Mock Supabase client for testing partnership persistence functions.
 * Simulates query builder chains and RPC calls with in-memory data.
 */

export const TEST_IDS = {
  player1: 'p1-aaaa-bbbb-cccc-ddddeeee0001',
  player2: 'p2-aaaa-bbbb-cccc-ddddeeee0002',
  player3: 'p3-aaaa-bbbb-cccc-ddddeeee0003',
  organizer: 'org-aaaa-bbbb-cccc-ddddeeee0099',
  tournament1: 't1-aaaa-bbbb-cccc-ddddeeee0001',
  category1: 'cat1-aaaa-bbbb-cccc-ddddeeee0001',
  category2: 'cat2-aaaa-bbbb-cccc-ddddeeee0002',
  request1: 'req1-aaaa-bbbb-cccc-ddddeeee0001',
  registration1: 'reg1-aaaa-bbbb-cccc-ddddeeee0001',
}

export function createMockStore() {
  return {
    profiles: [
      { id: TEST_IDS.player1, username: 'Jugador1', email: 'j1@test.com', avatar_url: null },
      { id: TEST_IDS.player2, username: 'Jugador2', email: 'j2@test.com', avatar_url: null },
      { id: TEST_IDS.player3, username: 'Jugador3', email: 'j3@test.com', avatar_url: null },
      { id: TEST_IDS.organizer, username: 'Organizador', email: 'org@test.com', avatar_url: null },
    ],
    tournaments: [
      { id: TEST_IDS.tournament1, name: 'Torneo Test', status: 'inscription', organizer_id: TEST_IDS.organizer },
    ],
    categories: [
      { id: TEST_IDS.category1, name: 'Cat A', max_couples: 4, tournament_id: TEST_IDS.tournament1 },
      { id: TEST_IDS.category2, name: 'Cat B', max_couples: 2, tournament_id: TEST_IDS.tournament1 },
    ],
    tournament_partnership_requests: [],
    tournament_registrations: [],
    notifications: [],
  }
}

/**
 * Creates a mock supabase client that operates on the given store.
 */
export function createMockSupabase(store) {
  function buildQuery(tableName) {
    let filters = []
    let selectFields = '*'
    let orderField = null
    let limitCount = null
    let isSingle = false
    let isMaybeSingle = false
    let isHead = false
    let isCount = false
    let insertData = null
    let updateData = null
    let inFilters = []

    const chain = {
      select(fields, opts) {
        selectFields = fields || '*'
        if (opts?.count === 'exact') isCount = true
        if (opts?.head) isHead = true
        return chain
      },
      eq(col, val) { filters.push({ type: 'eq', col, val }); return chain },
      neq(col, val) { filters.push({ type: 'neq', col, val }); return chain },
      or(expr) { filters.push({ type: 'or', expr }); return chain },
      in(col, vals) { inFilters.push({ col, vals }); return chain },
      gte(col, val) { filters.push({ type: 'gte', col, val }); return chain },
      order(field, opts) { orderField = { field, ...opts }; return chain },
      limit(n) { limitCount = n; return chain },
      single() { isSingle = true; return execute() },
      maybeSingle() { isMaybeSingle = true; return execute() },
    }

    function applyFilters(rows) {
      let result = [...rows]
      for (const f of filters) {
        if (f.type === 'eq') result = result.filter(r => r[f.col] === f.val)
        if (f.type === 'neq') result = result.filter(r => r[f.col] !== f.val)
        if (f.type === 'or') {
          const parts = f.expr.split(',')
          result = result.filter(r =>
            parts.some(p => {
              const m = p.match(/^(\w+)\.(eq|ilike)\.(.+)$/)
              if (!m) return false
              const [, col, op, val] = m
              if (op === 'eq') return r[col] === val
              if (op === 'ilike') {
                const pattern = val.replace(/%/g, '.*')
                return new RegExp(pattern, 'i').test(r[col] ?? '')
              }
              return false
            })
          )
        }
      }
      for (const inf of inFilters) {
        result = result.filter(r => inf.vals.includes(r[inf.col]))
      }
      if (limitCount) result = result.slice(0, limitCount)
      return result
    }

    function execute() {
      const table = store[tableName] ?? []

      if (insertData) {
        const rows = Array.isArray(insertData) ? insertData : [insertData]
        const inserted = rows.map(r => ({
          id: r.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ...r,
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString(),
        }))
        store[tableName].push(...inserted)
        if (isSingle) return Promise.resolve({ data: inserted[0], error: null })
        return Promise.resolve({ data: inserted, error: null })
      }

      if (updateData) {
        const matching = applyFilters(table)
        for (const row of matching) {
          Object.assign(row, updateData)
        }
        return Promise.resolve({ data: matching, error: null })
      }

      const rows = applyFilters(table)

      if (isCount && isHead) {
        return Promise.resolve({ count: rows.length, error: null })
      }

      if (isSingle) {
        return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: 'Not found' } })
      }
      if (isMaybeSingle) {
        return Promise.resolve({ data: rows[0] ?? null, error: null })
      }

      return Promise.resolve({ data: rows, error: null })
    }

    // For chaining .insert().select().single() etc
    chain.insert = (data) => {
      insertData = data
      const insertChain = {
        select: (f) => {
          selectFields = f
          return {
            single: () => {
              isSingle = true
              return execute()
            },
            then: (fn) => execute().then(fn),
          }
        },
        then: (fn) => execute().then(fn),
      }
      return insertChain
    }
    chain.update = (data) => {
      updateData = data
      return chain
    }
    chain.then = (fn) => execute().then(fn)

    return chain
  }

  return {
    from(tableName) { return buildQuery(tableName) },
    rpc(fnName, params) {
      if (fnName === 'convert_partnership_request_to_registration') {
        const regId = `reg-${Date.now()}`
        const requester = store.profiles.find(p => p.id === params.p_requester_id)
        const partner = store.profiles.find(p => p.id === params.p_partner_id)
        const teamName = `${requester?.username ?? '?'} / ${partner?.username ?? '?'}`
        store.tournament_registrations.push({
          id: regId,
          tournament_id: params.p_tournament_id,
          category_id: params.p_category_id,
          player1_id: params.p_requester_id,
          player2_id: params.p_partner_id,
          team_name: teamName,
          status: 'pending_organizer_approval',
          partnership_request_id: params.p_request_id,
        })
        const req = store.tournament_partnership_requests.find(r => r.id === params.p_request_id)
        if (req) {
          req.status = 'converted_to_registration'
          req.partner_response = 'accepted'
          req.partner_responded_at = new Date().toISOString()
          req.tournament_registrations_id = regId
        }
        return Promise.resolve({ data: regId, error: null })
      }
      if (fnName === 'reject_partnership_request') {
        const req = store.tournament_partnership_requests.find(r => r.id === params.p_request_id && r.status === 'pending_partner_acceptance')
        if (!req) return Promise.resolve({ data: null, error: { message: 'Request not found or not in pending status' } })
        req.status = 'declined'
        req.partner_response = 'declined'
        req.partner_responded_at = new Date().toISOString()
        req.rejected_reason = params.p_reason
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: null, error: { message: 'Unknown RPC' } })
    },
  }
}
