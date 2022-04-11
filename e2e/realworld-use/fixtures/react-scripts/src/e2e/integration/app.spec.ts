import ghOctocatPng from '../../assets/gh-octocat.png';
import reactLogoUrl from '../../assets/react-logo.svg';
import scopedCssStyles from '../../components/ScopedCss.module.css';
import scopedLessStyles from '../../components/ScopedLess.module.less';
import scopedScssStyles from '../../components/ScopedScss.module.scss';

describe('app', () => {
  before(() => {
    cy.intercept('GET', '/api/ping').as('getApiPing');
  });

  it('visits home', () => {
    cy.visit('/');
    cy.contains('Key Configs Verifying').should('be.visible');
    cy.get('#component-scoped-css').should('have.class', scopedCssStyles.root);
    cy.get('#component-scoped-scss').should('have.class', scopedScssStyles.root);
    cy.get('#component-scoped-less').should('have.class', scopedLessStyles.root);
    cy.get('#component-svg-as-url').should('have.attr', 'src', reactLogoUrl);
    cy.get('#component-img-as-url').should('have.attr', 'src', ghOctocatPng);
    cy.wait('@getApiPing')
      .its('response.body.timestamp')
      .then((timestamp) => {
        cy.get('#component-proxied-http-api-result').should('include.text', timestamp);
      });
  });
});
