// This file is not planned to be in the index.ts so it is private to this lib
import type { GuardsNavigationState } from '../model/guard-navigation.model'
import type { GuardExecutionContext } from './guard-types.utils'
import { ActivateGuardsWrapper } from './activate-guards-wrapper.utils'

jest.mock('./logger.utils', () => {
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
  return {
    createLogger: jest.fn(() => mockLogger),
    __mockLogger: mockLogger,
  }
})

const { __mockLogger: mockLogger } = require('./logger.utils')

const createRouterSyncState = (): GuardsNavigationState => ({
  isInitialRouterSync: true,
  isRouterSync: true,
})

const createGuardExecutionContext = (): GuardExecutionContext => ({
  location: {
    pathname: '/current',
    search: '',
    hash: '',
    state: null,
    key: 'current',
  },
  params: {},
  matches: [],
})

describe('canActivate when a guard fails', () => {
  beforeEach(() => {
    mockLogger.error.mockClear()
  })

  it('given a guard that throws, when canActivate is evaluated, then it resolves false and logs the error', async () => {
    const guardError = new Error('guard threw')
    const wrapper = new ActivateGuardsWrapper()

    const result = await wrapper.canActivate(
      createGuardExecutionContext(),
      [
        () => {
          throw guardError
        },
      ],
      createRouterSyncState()
    )

    expect(result).toBe(false)
    expect(mockLogger.error).toHaveBeenCalledWith('Guard failed, blocking activation:', guardError)
  })

  it('given a guard that rejects, when canActivate is evaluated, then it resolves false and logs the error', async () => {
    const guardError = new Error('guard rejected')
    const wrapper = new ActivateGuardsWrapper()

    const result = await wrapper.canActivate(
      createGuardExecutionContext(),
      [
        async () => {
          throw guardError
        },
      ],
      createRouterSyncState()
    )

    expect(result).toBe(false)
    expect(mockLogger.error).toHaveBeenCalledWith('Guard failed, blocking activation:', guardError)
  })
})

describe('canActivate when guards have mixed results', () => {
  beforeEach(() => {
    mockLogger.error.mockClear()
  })

  it('given a guard returning true and a guard returning false, then it resolves false', async () => {
    const wrapper = new ActivateGuardsWrapper()

    const result = await wrapper.canActivate(
      createGuardExecutionContext(),
      [async () => true, async () => false],
      createRouterSyncState()
    )

    expect(result).toBe(false)
    expect(mockLogger.error).not.toHaveBeenCalled()
  })
})

describe('canActivate when there are no guards', () => {
  beforeEach(() => {
    mockLogger.error.mockClear()
  })

  it('given no guards, when canActivate is evaluated, then it resolves true', async () => {
    const wrapper = new ActivateGuardsWrapper()

    const result = await wrapper.canActivate(createGuardExecutionContext(), [], createRouterSyncState())

    expect(result).toBe(true)
    expect(mockLogger.error).not.toHaveBeenCalled()
  })
})
