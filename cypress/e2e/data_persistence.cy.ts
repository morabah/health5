/// <reference types="cypress" />

describe('Mock Data Persistence', () => {
  const STORAGE_KEY = 'health_app_data_appointments';
  const testData = [
    {
      id: 'test-1',
      patientId: 'p-test',
      doctorId: 'd-test',
      appointmentDate: '2025-04-18',
      status: 'pending',
      startTime: '09:00',
      endTime: '09:30',
      appointmentType: 'General',
      reason: 'Test reason',
      location: 'Test location'
    }
  ];

  it('loads persisted appointments on Admin Appointments page', () => {
    cy.visit('/admin/appointments', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
      }
    });

    cy.contains('Test reason').should('exist');
    cy.contains('2025-04-18').should('exist');

    cy.reload();
    cy.contains('Test reason').should('exist');
    cy.contains('2025-04-18').should('exist');
  });
});
