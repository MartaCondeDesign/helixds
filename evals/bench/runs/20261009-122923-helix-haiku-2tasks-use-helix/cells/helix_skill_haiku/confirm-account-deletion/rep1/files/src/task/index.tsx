import { useState } from 'react';
import { Button, Card, Modal } from '@helixds/react';

const styles = {
  container: {
    padding: 'var(--helix-spacing-l)',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--helix-spacing-m)',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--helix-color-text-primary)',
  },
  sectionDescription: {
    fontSize: '0.875rem',
    color: 'var(--helix-color-text-secondary)',
  },
  divider: {
    borderTop: `1px solid var(--helix-color-border-neutral)`,
    paddingTop: 'var(--helix-spacing-m)',
  },
  deleteSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--helix-spacing-s)',
  },
  deleteTitle: {
    fontWeight: 500,
    color: 'var(--helix-color-text-primary)',
  },
  deleteDescription: {
    fontSize: '0.875rem',
    color: 'var(--helix-color-text-secondary)',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--helix-spacing-m)',
  },
  modalDescription: {
    fontSize: '0.875rem',
    color: 'var(--helix-color-text-secondary)',
  },
  buttonGroup: {
    display: 'flex',
    gap: 'var(--helix-spacing-s)',
    justifyContent: 'flex-end',
  },
};

export function TaskScreen() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    console.log('Account deleted');
  };

  const handleDismissModal = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div style={styles.container}>
      <Card>
        <div style={styles.cardContent}>
          <h2 style={styles.sectionTitle}>Account Settings</h2>
          <p style={styles.sectionDescription}>Manage your account and preferences</p>

          <div style={styles.divider}>
            <div style={styles.deleteSection}>
              <h3 style={styles.deleteTitle}>Delete Account</h3>
              <p style={styles.deleteDescription}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <div>
                <Button
                  variant="danger"
                  onClick={handleDeleteClick}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        label="Delete Account?"
        expanded={isDeleteModalOpen}
        onDismiss={handleDismissModal}
      >
        <div style={styles.modalContent}>
          <p style={styles.modalDescription}>
            Are you absolutely sure? This action cannot be undone. Your account and all associated data will be permanently deleted.
          </p>

          <div style={styles.buttonGroup}>
            <Button
              variant="secondary"
              onClick={handleDismissModal}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
