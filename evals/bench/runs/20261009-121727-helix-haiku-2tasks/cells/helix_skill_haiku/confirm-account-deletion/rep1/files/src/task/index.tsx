import { useState } from 'react';
import {
  Button,
  Card,
  Modal,
  PageHeader,
} from '@helixds/react';

export function TaskScreen() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleted(true);
    setIsDeleteModalOpen(false);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  if (isDeleted) {
    return (
      <div style={{ padding: '2rem' }}>
        <PageHeader
          title="Account Deleted"
          description="Your account has been successfully deleted. You will be redirected shortly."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <PageHeader
        title="Account Settings"
        description="Manage your account and privacy settings"
      />

      <div style={{ marginTop: '2rem', maxWidth: '600px' }}>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
              Danger Zone
            </h2>
            <p style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--helix-color-text-secondary)' }}>
              Deleting your account is permanent and cannot be undone.
            </p>
            <Button
              onClick={handleDeleteClick}
              variant="danger"
              label="Delete Account"
            />
          </div>
        </Card>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        label="Confirm Account Deletion"
      >
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
            Delete Account?
          </h2>
          <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--helix-color-text-secondary)' }}>
            This action cannot be undone. All your data, including:
          </p>
          <ul style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--helix-color-text-secondary)' }}>
            <li>Your profile information</li>
            <li>All saved conversations and data</li>
            <li>Your account preferences</li>
          </ul>
          <p style={{ marginTop: '1rem', marginBottom: '2rem', fontWeight: 500, color: 'var(--helix-color-text-neutral)' }}>
            will be permanently deleted.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleCancelDelete}
              variant="secondary"
              label="Cancel"
            />
            <Button
              onClick={handleConfirmDelete}
              variant="danger"
              label="Delete My Account"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
