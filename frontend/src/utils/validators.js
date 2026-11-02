/**
 * Client-side validation. Mirrors the backend rules (the DTOs in
 * com.careercraft.dto.request) so users get instant feedback.
 * The backend still validates everything.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/\S+$/;
const PHONE_REGEX = /^[+0-9()\-\s]{7,20}$/;

// ------------------------------------------------------------------ auth

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
  if (email.trim().length > 150) return 'Email must be at most 150 characters';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password must be at most 72 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return '';
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateRegisterForm({ fullName, email, password, confirmPassword }) {
  const errors = {};
  const nameError = validateFullName(fullName);
  if (nameError) errors.fullName = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';

  return errors;
}

/** Returns 0-4 for the password strength meter. */
export function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

// ------------------------------------------------------------------ shared helpers

function validateFullName(fullName) {
  const name = fullName.trim();
  if (!name) return 'Full name is required';
  if (name.length < 2 || name.length > 100) return 'Full name must be between 2 and 100 characters';
  return '';
}

function maxLength(value, max, label) {
  return value && value.trim().length > max ? `${label} must be at most ${max} characters` : '';
}

function optionalUrl(value) {
  if (!value || !value.trim()) return '';
  if (!URL_REGEX.test(value.trim())) return 'URL must start with http:// or https://';
  return maxLength(value, 255, 'URL');
}

function required(value, label) {
  return value && String(value).trim() ? '' : `${label} is required`;
}

/** Adds non-empty messages to the errors object. */
function collect(entries) {
  return Object.fromEntries(entries.filter(([, message]) => Boolean(message)));
}

/** Month strings ("2023-06") compare correctly as plain strings. */
function endDateError(start, end, isCurrent, requiredMessage) {
  if (isCurrent) return '';
  if (!end) return requiredMessage;
  if (start && end < start) return 'End date cannot be before the start date';
  return '';
}

// ------------------------------------------------------------------ profile

export function validatePersonalInfo(form) {
  return collect([
    ['fullName', validateFullName(form.fullName)],
    ['headline', maxLength(form.headline, 120, 'Headline')],
    ['phone', form.phone.trim() && !PHONE_REGEX.test(form.phone.trim()) ? 'Please enter a valid phone number' : ''],
    ['location', maxLength(form.location, 100, 'Location')],
    ['about', maxLength(form.about, 2000, 'About')],
    ['linkedinUrl', optionalUrl(form.linkedinUrl)],
    ['githubUrl', optionalUrl(form.githubUrl)],
    ['websiteUrl', optionalUrl(form.websiteUrl)],
  ]);
}

export function validateEducation(form) {
  return collect([
    ['institution', required(form.institution, 'Institution') || maxLength(form.institution, 150, 'Institution')],
    ['degree', required(form.degree, 'Degree') || maxLength(form.degree, 120, 'Degree')],
    ['fieldOfStudy', maxLength(form.fieldOfStudy, 120, 'Field of study')],
    ['startDate', required(form.startDate, 'Start date')],
    [
      'endDate',
      endDateError(form.startDate, form.endDate, form.currentlyStudying, 'End date is required unless you are currently studying here'),
    ],
    ['grade', maxLength(form.grade, 30, 'Grade')],
    ['description', maxLength(form.description, 1000, 'Description')],
  ]);
}

export function validateExperience(form) {
  return collect([
    ['jobTitle', required(form.jobTitle, 'Job title') || maxLength(form.jobTitle, 120, 'Job title')],
    ['company', required(form.company, 'Company') || maxLength(form.company, 150, 'Company')],
    ['location', maxLength(form.location, 100, 'Location')],
    ['startDate', required(form.startDate, 'Start date')],
    [
      'endDate',
      endDateError(form.startDate, form.endDate, form.currentlyWorking, 'End date is required unless you currently work here'),
    ],
    ['description', maxLength(form.description, 2000, 'Description')],
  ]);
}

export function validateCertification(form) {
  return collect([
    ['name', required(form.name, 'Certification name') || maxLength(form.name, 150, 'Name')],
    ['issuer', required(form.issuer, 'Issuer') || maxLength(form.issuer, 150, 'Issuer')],
    ['issueDate', required(form.issueDate, 'Issue date')],
    [
      'expiryDate',
      form.expiryDate && form.issueDate && form.expiryDate < form.issueDate
        ? 'Expiry date cannot be before the issue date'
        : '',
    ],
    ['credentialId', maxLength(form.credentialId, 100, 'Credential ID')],
    ['credentialUrl', optionalUrl(form.credentialUrl)],
  ]);
}

export function validateSkillName(name, existingSkills) {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a skill name';
  if (trimmed.length > 60) return 'Skill name must be at most 60 characters';
  if (existingSkills.some((skill) => skill.name.toLowerCase() === trimmed.toLowerCase())) {
    return 'You already added this skill';
  }
  if (existingSkills.length >= 50) return 'You can add up to 50 skills';
  return '';
}
