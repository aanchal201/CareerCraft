import { describe, expect, it } from 'vitest';
import {
  getPasswordStrength,
  validateEmail,
  validateExperience,
  validatePassword,
  validatePersonalInfo,
  validateRegisterForm,
  validateSkillName,
} from './validators';

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    expect(validateEmail('asha@example.com')).toBe('');
  });
  it('rejects empty and malformed addresses', () => {
    expect(validateEmail('  ')).toBe('Email is required');
    expect(validateEmail('asha@')).toBe('Please enter a valid email address');
  });
});

describe('validatePassword', () => {
  it('requires 8+ characters with a letter and a number (same as the backend)', () => {
    expect(validatePassword('short1')).toMatch(/at least 8/);
    expect(validatePassword('onlyletters')).toMatch(/letter and one number/);
    expect(validatePassword('12345678')).toMatch(/letter and one number/);
    expect(validatePassword('secret123')).toBe('');
  });
  it('rejects passwords longer than 72 characters (BCrypt limit)', () => {
    expect(validatePassword(`a1${'x'.repeat(71)}`)).toMatch(/at most 72/);
  });
});

describe('validateRegisterForm', () => {
  it('reports every problem at once', () => {
    const errors = validateRegisterForm({ fullName: 'A', email: 'bad', password: 'secret123', confirmPassword: 'other' });
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'fullName']);
  });
  it('passes a valid form', () => {
    expect(
      validateRegisterForm({ fullName: 'Asha Verma', email: 'asha@example.com', password: 'secret123', confirmPassword: 'secret123' })
    ).toEqual({});
  });
});

describe('getPasswordStrength', () => {
  it('scores from 0 to 4', () => {
    expect(getPasswordStrength('')).toBe(0);
    expect(getPasswordStrength('abcdefgh')).toBe(1);
    expect(getPasswordStrength('Abcdefgh1234!')).toBe(4);
  });
});

describe('profile validation', () => {
  const personal = { fullName: 'Asha Verma', headline: '', phone: '', location: '', about: '', linkedinUrl: '', githubUrl: '', websiteUrl: '' };

  it('only allows http(s) links - blocks javascript: URLs', () => {
    expect(validatePersonalInfo({ ...personal, websiteUrl: 'javascript:alert(1)' })).toHaveProperty('websiteUrl');
    expect(validatePersonalInfo({ ...personal, websiteUrl: 'https://asha.dev' })).toEqual({});
  });

  it('end date cannot be before start date unless current', () => {
    const job = { jobTitle: 'Intern', company: 'Acme', location: '', startDate: '2024-06', endDate: '2024-01', currentlyWorking: false, description: '' };
    expect(validateExperience(job)).toHaveProperty('endDate');
    expect(validateExperience({ ...job, currentlyWorking: true })).toEqual({});
  });

  it('skill names must be unique (case-insensitive)', () => {
    expect(validateSkillName('react', [{ name: 'React' }])).toMatch(/already/);
    expect(validateSkillName('Java', [{ name: 'React' }])).toBe('');
  });
});
