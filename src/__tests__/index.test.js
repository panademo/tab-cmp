/* eslint no-underscore-dangle:0 */

jest.mock('src/initCMP')
jest.mock('src/getClientLocation')
jest.mock('src/qcCmpModified')
jest.mock('src/setDefaultUSPData')
jest.mock('src/logger')

beforeEach(() => {
  window.__tcfapi = jest.fn()
  window.__uspapi = jest.fn()
  const getClientLocation = require('src/getClientLocation').default
  getClientLocation.mockResolvedValue({
    countryISOCode: 'DE',
    isInUS: false,
    isInEuropeanUnion: true,
    queryTime: '2018-05-15T10:30:00.000Z',
  })
})

afterEach(() => {
  // Reset console mocks.
  // eslint-disable-next-line no-console
  if (console.warn.mockRestore) {
    // eslint-disable-next-line no-console
    console.warn.mockRestore()
  }
  // eslint-disable-next-line no-console
  if (console.error.mockRestore) {
    // eslint-disable-next-line no-console
    console.error.mockRestore()
  }
  jest.clearAllMocks()
  jest.resetModules()
  delete window.tabCMP
})

const getMockOptions = () => ({
  debug: false,
  displayPersistentConsentLink: true,
  onError: () => {},
  primaryButtonColor: '#FF0000',
  publisherName: 'My Cool Site',
  publisherLogo: 'https://example.com/some-logo.png',
})

describe('index.js:', () => {
  it('defines initializeCMP', () => {
    expect.assertions(1)
    const index = require('src/index')
    expect(index.initializeCMP).toBeDefined()
  })

  it('defines getCMPHeadScript', () => {
    expect.assertions(1)
    const index = require('src/index')
    expect(index.getCMPHeadScript).toBeDefined()
  })

  it('defines doesGDPRApply', () => {
    expect.assertions(1)
    const index = require('src/index')
    expect(index.doesGDPRApply).toBeDefined()
  })

  it('defines doesCCPAApply', () => {
    expect.assertions(1)
    const index = require('src/index')
    expect(index.doesCCPAApply).toBeDefined()
  })

  it('defines openTCFConsentDialog', () => {
    expect.assertions(1)
    const index = require('src/index')
    expect(index.openTCFConsentDialog).toBeDefined()
  })

  it('defines openCCPAConsentDialog', () => {
    expect.assertions(1)
    const index = require('src/index')
    expect(index.openCCPAConsentDialog).toBeDefined()
  })
})

describe('index.js: initializeCMP', () => {
  it('warns if calling initializeCMP more than once', () => {
    expect.assertions(2)
    const index = require('src/index')
    const mockConsoleWarn = jest.fn()
    jest.spyOn(console, 'warn').mockImplementation(mockConsoleWarn)
    index.initializeCMP()
    expect(mockConsoleWarn).not.toHaveBeenCalled()
    index.initializeCMP()
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[tab-cmp] initializeCMP was called more than once. Ignoring this initialization.'
    )
  })

  it('calls console.error if setUpLogger fails but does not throw', async () => {
    expect.assertions(2)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)

    // Arbitrarily break setUpLogger.
    const mockErr = new Error('Oh no.')
    const { setUpLogger } = require('src/logger')
    setUpLogger.mockImplementationOnce(() => {
      throw mockErr
    })

    await expect(index.initializeCMP()).resolves.not.toThrow()
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[tab-cmp] Failed to set up logger.',
      mockErr
    )
  })

  it('calls logError and does not throw if something goes wrong', async () => {
    expect.assertions(2)
    const index = require('src/index')

    // Arbitrarily break the method.
    const mockErr = new Error('Oh no.')
    const initCMP = require('src/initCMP').default
    initCMP.mockImplementationOnce(() => {
      throw mockErr
    })

    await expect(index.initializeCMP()).resolves.not.toThrow()
    const { logError } = require('src/logger')
    expect(logError).toHaveBeenCalledWith(mockErr)
  })

  it('calls logDebugging with info on provided options', async () => {
    expect.assertions(1)
    const opts = getMockOptions()
    const index = require('src/index')
    await index.initializeCMP(opts)
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenCalledWith(
      `Called initializeCMP with options: ${JSON.stringify(opts)}`
    )
  })

  it('calls logDebugging with info on client location', async () => {
    expect.assertions(1)
    const getClientLocation = require('src/getClientLocation').default
    getClientLocation.mockResolvedValue({
      countryISOCode: 'DE',
      isInUS: false,
      isInEuropeanUnion: true,
      queryTime: '2018-05-15T10:30:00.000Z',
    })
    const opts = getMockOptions()
    const index = require('src/index')
    await index.initializeCMP(opts)
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenCalledWith(
      `Client location. isInEU: true. isInUS: false`
    )
  })

  it('calls initCMP', async () => {
    expect.assertions(1)
    const index = require('src/index')
    await index.initializeCMP()
    const initCMP = require('src/initCMP').default
    expect(initCMP).toHaveBeenCalled()
  })

  it('calls setDefaultUSPData', async () => {
    expect.assertions(1)
    const index = require('src/index')
    await index.initializeCMP()
    const setDefaultUSPData = require('src/setDefaultUSPData').default
    expect(setDefaultUSPData).toHaveBeenCalled()
  })

  it('passes default options to initCMP when no options are provided', async () => {
    expect.assertions(1)
    const index = require('src/index')
    await index.initializeCMP()
    const initCMP = require('src/initCMP').default
    expect(initCMP).toHaveBeenCalledWith({
      debug: false,
      displayPersistentConsentLink: false,
      onError: expect.any(Function),
      primaryButtonColor: '#9d4ba3',
      publisherName: 'Tab for a Cause',
      publisherLogo:
        'https://tab.gladly.io/static/logo-with-text-257bbffc6dcac5076e8ac31eed8ff73c.svg',
    })
  })

  it('overrides default options to initCMP when some options are provided', async () => {
    expect.assertions(1)
    const index = require('src/index')
    await index.initializeCMP({
      debug: true,
      publisherName: 'My Site',
      publisherLogo: undefined,
    })
    const initCMP = require('src/initCMP').default
    expect(initCMP).toHaveBeenCalledWith({
      debug: true,
      displayPersistentConsentLink: false,
      onError: expect.any(Function),
      primaryButtonColor: '#9d4ba3',
      publisherName: 'My Site',
      publisherLogo: undefined,
    })
  })

  it('sets up logging using default options when none are provided', async () => {
    expect.assertions(1)
    const index = require('src/index')
    await index.initializeCMP()
    const { setUpLogger } = require('src/logger')
    expect(setUpLogger).toHaveBeenCalledWith({
      debug: false,
      onErrorCallback: expect.any(Function),
    })
  })

  it('sets up logging using provided options', async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockOnErrCb = () => {}
    await index.initializeCMP({ debug: true, onError: mockOnErrCb })
    const { setUpLogger } = require('src/logger')
    expect(setUpLogger).toHaveBeenCalledWith({
      debug: true,
      onErrorCallback: mockOnErrCb,
    })
  })

  it('sets window.tabCMP.doesGDPRApply to true when the client location is in the EU', async () => {
    expect.assertions(1)
    const getClientLocation = require('src/getClientLocation').default
    getClientLocation.mockResolvedValue({
      countryISOCode: 'DE',
      isInUS: false,
      isInEuropeanUnion: true,
      queryTime: '2018-05-15T10:30:00.000Z',
    })
    const index = require('src/index')
    await index.initializeCMP()
    expect(window.tabCMP.doesGDPRApply).toBe(true)
  })

  it('sets window.tabCMP.doesGDPRApply to false when the client location is not in the EU', async () => {
    expect.assertions(1)
    const getClientLocation = require('src/getClientLocation').default
    getClientLocation.mockResolvedValue({
      countryISOCode: 'JP',
      isInUS: false,
      isInEuropeanUnion: false,
      queryTime: '2018-05-15T10:30:00.000Z',
    })
    const index = require('src/index')
    await index.initializeCMP()
    expect(window.tabCMP.doesGDPRApply).toBe(false)
  })

  it('sets window.tabCMP.doesCCPAApply to true when the client location is in the US', async () => {
    expect.assertions(1)
    const getClientLocation = require('src/getClientLocation').default
    getClientLocation.mockResolvedValue({
      countryISOCode: 'US',
      isInUS: true,
      isInEuropeanUnion: false,
      queryTime: '2018-05-15T10:30:00.000Z',
    })
    const index = require('src/index')
    await index.initializeCMP()
    expect(window.tabCMP.doesCCPAApply).toBe(true)
  })

  it('sets window.tabCMP.doesCCPAApply to false when the client location is not in the US', async () => {
    expect.assertions(1)
    const getClientLocation = require('src/getClientLocation').default
    getClientLocation.mockResolvedValue({
      countryISOCode: 'DE',
      isInUS: false,
      isInEuropeanUnion: true,
      queryTime: '2018-05-15T10:30:00.000Z',
    })
    const index = require('src/index')
    await index.initializeCMP()
    expect(window.tabCMP.doesCCPAApply).toBe(false)
  })

  it('sets window.tabCMP.doesGDPRApply and window.tabCMP.doesCCPAApply to false when the client location fails', async () => {
    expect.assertions(2)
    const getClientLocation = require('src/getClientLocation').default
    getClientLocation.mockRejectedValue(new Error('Uh oh.'))
    const index = require('src/index')
    await index.initializeCMP()
    expect(window.tabCMP.doesGDPRApply).toBe(false)
    expect(window.tabCMP.doesCCPAApply).toBe(false)
  })
})

describe('index.js: getCMPHeadScript', () => {
  it("calls console.error if it's called before calling initializeCMP", () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    index.getCMPHeadScript()
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[tab-cmp] initializeCMP must be called before calling any other tab-cmp methods.'
    )
  })

  it("does not call console.error if it's called after calling initializeCMP", () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    index.initializeCMP()
    index.getCMPHeadScript()
    expect(mockConsoleError).not.toHaveBeenCalled()
  })

  it('calls logDebugging with info', () => {
    expect.assertions(1)
    const index = require('src/index')
    index.initializeCMP()
    index.getCMPHeadScript()
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenLastCalledWith(`TODO: getCMPHeadScript`)
  })

  it('calls logError and does not throw if something goes wrong', () => {
    expect.assertions(2)
    const index = require('src/index')
    index.initializeCMP()

    // Arbitrarily break the method.
    const mockErr = new Error('Oh no.')
    const { logDebugging } = require('src/logger')
    logDebugging.mockImplementationOnce(() => {
      throw mockErr
    })

    expect(() => {
      index.getCMPHeadScript()
    }).not.toThrow()
    const { logError } = require('src/logger')
    expect(logError).toHaveBeenCalledWith(mockErr)
  })
})

describe('index.js: doesGDPRApply', () => {
  it("calls console.error if it's called before calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    await index.doesGDPRApply()
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[tab-cmp] initializeCMP must be called before calling any other tab-cmp methods.'
    )
  })

  it("does not call console.error if it's called after calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    index.initializeCMP()
    await index.doesGDPRApply()
    expect(mockConsoleError).not.toHaveBeenCalled()
  })

  it('calls logDebugging with info', async () => {
    expect.assertions(1)
    const index = require('src/index')
    index.initializeCMP()
    await index.doesGDPRApply()
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenLastCalledWith(`TODO: doesGDPRApply`)
  })

  it('calls logError and does not throw if something goes wrong', async () => {
    expect.assertions(2)
    const index = require('src/index')
    index.initializeCMP()

    // Arbitrarily break the method.
    const mockErr = new Error('Oh no.')
    const { logDebugging } = require('src/logger')
    logDebugging.mockImplementationOnce(() => {
      throw mockErr
    })

    await expect(index.doesGDPRApply()).resolves.not.toThrow()
    const { logError } = require('src/logger')
    expect(logError).toHaveBeenCalledWith(mockErr)
  })
})

describe('index.js: doesCCPAApply', () => {
  it("calls console.error if it's called before calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    await index.doesCCPAApply()
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[tab-cmp] initializeCMP must be called before calling any other tab-cmp methods.'
    )
  })

  it("does not call console.error if it's called after calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    index.initializeCMP()
    await index.doesCCPAApply()
    expect(mockConsoleError).not.toHaveBeenCalled()
  })

  it('calls logDebugging with info', async () => {
    expect.assertions(1)
    const index = require('src/index')
    index.initializeCMP()
    await index.doesCCPAApply()
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenLastCalledWith(`TODO: doesCCPAApply`)
  })

  it('calls logError and does not throw if something goes wrong', async () => {
    expect.assertions(2)
    const index = require('src/index')
    index.initializeCMP()

    // Arbitrarily break the method.
    const mockErr = new Error('Oh no.')
    const { logDebugging } = require('src/logger')
    logDebugging.mockImplementationOnce(() => {
      throw mockErr
    })

    await expect(index.doesCCPAApply()).resolves.not.toThrow()
    const { logError } = require('src/logger')
    expect(logError).toHaveBeenCalledWith(mockErr)
  })
})

describe('index.js: openTCFConsentDialog', () => {
  it("calls console.error if it's called before calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    await index.openTCFConsentDialog()
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[tab-cmp] initializeCMP must be called before calling any other tab-cmp methods.'
    )
  })

  it("does not call console.error if it's called after calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    index.initializeCMP()
    await index.openTCFConsentDialog()
    expect(mockConsoleError).not.toHaveBeenCalled()
  })

  it('calls logDebugging with info', async () => {
    expect.assertions(1)
    const index = require('src/index')
    index.initializeCMP()
    await index.openTCFConsentDialog()
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenLastCalledWith(`TODO: openTCFConsentDialog`)
  })

  it('calls logError and does not throw if something goes wrong', async () => {
    expect.assertions(2)
    const index = require('src/index')
    index.initializeCMP()

    // Arbitrarily break the method.
    const mockErr = new Error('Oh no.')
    const { logDebugging } = require('src/logger')
    logDebugging.mockImplementationOnce(() => {
      throw mockErr
    })

    await expect(index.openTCFConsentDialog()).resolves.not.toThrow()
    const { logError } = require('src/logger')
    expect(logError).toHaveBeenCalledWith(mockErr)
  })
})

describe('index.js: openCCPAConsentDialog', () => {
  it("calls console.error if it's called before calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    await index.openCCPAConsentDialog()
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[tab-cmp] initializeCMP must be called before calling any other tab-cmp methods.'
    )
  })

  it("does not call console.error if it's called after calling initializeCMP", async () => {
    expect.assertions(1)
    const index = require('src/index')
    const mockConsoleError = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError)
    index.initializeCMP()
    await index.openCCPAConsentDialog()
    expect(mockConsoleError).not.toHaveBeenCalled()
  })

  it('calls logDebugging with info', async () => {
    expect.assertions(1)
    const index = require('src/index')
    index.initializeCMP()
    await index.openCCPAConsentDialog()
    const { logDebugging } = require('src/logger')
    expect(logDebugging).toHaveBeenLastCalledWith(`TODO: openCCPAConsentDialog`)
  })

  it('calls logError and does not throw if something goes wrong', async () => {
    expect.assertions(2)
    const index = require('src/index')
    index.initializeCMP()

    // Arbitrarily break the method.
    const mockErr = new Error('Oh no.')
    const { logDebugging } = require('src/logger')
    logDebugging.mockImplementationOnce(() => {
      throw mockErr
    })

    await expect(index.openCCPAConsentDialog()).resolves.not.toThrow()
    const { logError } = require('src/logger')
    expect(logError).toHaveBeenCalledWith(mockErr)
  })
})
