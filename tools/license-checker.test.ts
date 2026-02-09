import { describe } from 'vitest'

describe('license-checker', () => {
  describe('policy loading', () => {
    // TODO: implement — test loading valid policy
    // TODO: implement — test missing policy file
    // TODO: implement — test empty allowedLicenses (strict mode)
  })

  describe('license detection', () => {
    // TODO: implement — test reading license from package.json
    // TODO: implement — test reading deprecated licenses array
    // TODO: implement — test fallback to LICENSE file
    // TODO: implement — test override takes priority
    // TODO: implement — test unknown when no license found
  })

  describe('SPDX expression handling', () => {
    // TODO: implement — test simple license identifier
    // TODO: implement — test OR expression passes if any is allowed
    // TODO: implement — test OR expression fails if none is allowed
  })

  describe('compliance check', () => {
    // TODO: implement — test allowed license passes
    // TODO: implement — test disallowed license is a violation
    // TODO: implement — test unknown license is a warning
    // TODO: implement — test override license is used
  })

  describe('report generation', () => {
    // TODO: implement — test JSON report structure
    // TODO: implement — test report directory creation
  })

  describe('CLI output', () => {
    // TODO: implement — test clean output (no violations)
    // TODO: implement — test violation output
    // TODO: implement — test warning output
  })
})
