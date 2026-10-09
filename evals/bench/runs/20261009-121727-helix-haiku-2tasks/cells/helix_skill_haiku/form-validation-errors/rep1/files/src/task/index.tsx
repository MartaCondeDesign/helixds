import { useState } from 'react';
import { Button, Card, Input, Select } from '@helixds/react';

export function TaskScreen() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; role?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitted(true);
      setEmail('');
      setRole('');
      setErrors({});
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: 'var(--helix-color-fill-secondary)' }}>
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--helix-color-text-primary)' }}>
            Invite Team Member
          </h1>
          <p className="mb-6" style={{ color: 'var(--helix-color-text-secondary)' }}>
            Add a new member to your team
          </p>

          {isSubmitted && (
            <div
              className="mb-4 p-3 rounded border"
              style={{
                backgroundColor: 'var(--helix-color-fill-success-subtle)',
                borderColor: 'var(--helix-color-border-success)',
                color: 'var(--helix-color-text-success)',
              }}
            >
              <p className="text-sm font-medium">Invitation sent successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--helix-color-text-primary)' }}>
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm mt-1.5" style={{ color: 'var(--helix-color-text-danger)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2" style={{ color: 'var(--helix-color-text-primary)' }}>
                Role
              </label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? 'role-error' : undefined}
              >
                <option value="">-- Select a role --</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </Select>
              {errors.role && (
                <p id="role-error" className="text-sm mt-1.5" style={{ color: 'var(--helix-color-text-danger)' }}>
                  {errors.role}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full mt-6">
              Send Invitation
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
