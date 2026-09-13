import { describe, it, expect } from 'vitest';
import { grantsDriveFile, DRIVE_SCOPE } from './connection';

describe('grantsDriveFile', () => {
  it('accepts the scope on its own', () => {
    expect(grantsDriveFile(DRIVE_SCOPE)).toBe(true);
  });

  it('accepts a grant carrying more than we asked for', () => {
    // Exactly what Google returned in practice: drive.file plus the openid,
    // email and profile scopes the account had already granted elsewhere in
    // the project. An equality check called this a broken connection and told
    // the user to reconnect, which would not have helped.
    const granted = [
      DRIVE_SCOPE,
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ].join(' ');

    expect(grantsDriveFile(granted)).toBe(true);
  });

  it('does not care about ordering', () => {
    expect(grantsDriveFile(`openid ${DRIVE_SCOPE}`)).toBe(true);
  });

  it('tolerates odd whitespace', () => {
    expect(grantsDriveFile(`  openid   ${DRIVE_SCOPE}  `)).toBe(true);
  });

  it('rejects a grant that lost drive.file', () => {
    expect(grantsDriveFile('openid https://www.googleapis.com/auth/userinfo.email')).toBe(false);
    expect(grantsDriveFile('')).toBe(false);
  });

  it('does not match a different scope that merely contains the string', () => {
    // Membership of the split set, not a substring test — otherwise a broader
    // or narrower Drive scope sharing the prefix would read as a match.
    expect(grantsDriveFile('https://www.googleapis.com/auth/drive.file.readonly')).toBe(false);
    expect(grantsDriveFile('https://www.googleapis.com/auth/drive')).toBe(false);
  });
});
