import { logError } from 'src/logger'

jest.mock('src/logger')

beforeEach(() => {
  window.__uspapi = jest.fn()
})

afterEach(() => {
  jest.clearAllMocks()
})

const getMockPingResponse = () => ({
  cmpLoaded: true,
  jurisdiction: ['US'],
  location: 'US',
  mode: ['GDPR', 'USP'],
})

describe('setDefaultUSPData', () => {
  it('does not error if window.__uspapi is undefined', () => {
    expect.assertions(1)
    delete window.__uspapi
    const setDefaultUSPData = require('src/setDefaultUSPData').default
    expect(() => {
      setDefaultUSPData()
    }).not.toThrow()
  })

  it('calls setUspDftData when there is no error and the user is in the US jurisdiction', () => {
    expect.assertions(1)
    const mockPingResponse = getMockPingResponse()
    const mockPingStatus = true
    let calledToSetDefault = false
    window.__uspapi.mockImplementation((cmd, version, callback) => {
      switch (cmd) {
        case 'uspPing': {
          callback(mockPingResponse, mockPingStatus)
          break
        }
        case 'setUspDftData': {
          calledToSetDefault = true
          callback(mockPingResponse, mockPingStatus)
          break
        }
        default:
      }
    })
    const setDefaultUSPData = require('src/setDefaultUSPData').default
    setDefaultUSPData()
    expect(calledToSetDefault).toBe(true)
  })

  it('does not call setUspDftData the user is not in the US', () => {
    expect.assertions(1)
    const mockPingResponse = {
      ...getMockPingResponse(),
      location: 'FR',
    }
    const mockPingStatus = true
    let calledToSetDefault = false
    window.__uspapi.mockImplementation((cmd, version, callback) => {
      switch (cmd) {
        case 'uspPing': {
          callback(mockPingResponse, mockPingStatus)
          break
        }
        case 'setUspDftData': {
          calledToSetDefault = true
          callback(mockPingResponse, mockPingStatus)
          break
        }
        default:
      }
    })
    const setDefaultUSPData = require('src/setDefaultUSPData').default
    setDefaultUSPData()
    expect(calledToSetDefault).toBe(false)
  })

  it('calls logError if there is a problem setting default USP data', () => {
    expect.assertions(1)
    const mockPingResponse = getMockPingResponse()
    const mockPingStatus = true
    window.__uspapi.mockImplementation((cmd, version, callback) => {
      switch (cmd) {
        case 'uspPing': {
          callback(mockPingResponse, mockPingStatus)
          break
        }
        case 'setUspDftData': {
          callback(mockPingResponse, false) // false === bad status
          break
        }
        default:
      }
    })
    const setDefaultUSPData = require('src/setDefaultUSPData').default
    setDefaultUSPData()
    expect(logError).toHaveBeenCalledWith(
      '[tab-cmp] Unable to set default USP string.'
    )
  })
})
