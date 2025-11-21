/**
 * Issue Validation Script
 * 
 * This script helps validate GitHub issues for completeness and potential duplicates.
 * It can be used by maintainers to triage new issues effectively.
 */

interface IssueValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  duplicateRisk: 'low' | 'medium' | 'high';
}

interface IssueData {
  title: string;
  body: string;
  labels: string[];
  type: 'bug' | 'feature' | 'security' | 'build' | 'config' | 'task';
}

class IssueValidator {
  private commonErrorPatterns = [
    'Cannot find module',
    'TypeError:',
    'ReferenceError:',
    'SyntaxError:',
    '404',
    '500',
    'Unauthorized',
    'Forbidden',
    'Connection refused',
    'Database connection failed',
    'Build failed',
    'Test failed'
  ];

  private commonFeatureKeywords = [
    'add', 'implement', 'create', 'support', 'enable', 'integrate',
    'improve', 'enhance', 'optimize', 'refactor', 'update', 'upgrade'
  ];

  validateIssue(issue: IssueData): IssueValidation {
    const validation: IssueValidation = {
      isValid: true,
      warnings: [],
      suggestions: [],
      duplicateRisk: 'low'
    };

    // Check for required fields based on issue type
    this.validateRequiredFields(issue, validation);
    
    // Check for duplicate indicators
    this.assessDuplicateRisk(issue, validation);
    
    // Check issue quality
    this.assessIssueQuality(issue, validation);
    
    // Type-specific validations
    this.performTypeSpecificValidation(issue, validation);

    return validation;
  }

  private validateRequiredFields(issue: IssueData, validation: IssueValidation): void {
    const body = issue.body.toLowerCase();
    
    // Check for related issues field
    if (!body.includes('related issues') && !body.includes('#')) {
      validation.warnings.push('Missing "Related Issues" field - please check for duplicates');
      validation.isValid = false;
    }

    // Check for keywords field
    if (!body.includes('keywords') && !body.includes('key terms')) {
      validation.warnings.push('Missing keywords field - helps prevent duplicates');
      validation.isValid = false;
    }

    // Check for reproduction steps (for bugs)
    if (issue.type === 'bug' && !body.includes('reproduction steps')) {
      validation.warnings.push('Missing reproduction steps - essential for bug reports');
      validation.isValid = false;
    }

    // Check for environment info
    if (!body.includes('environment') && !body.includes('version')) {
      validation.suggestions.push('Consider adding environment information for better context');
    }
  }

  private assessDuplicateRisk(issue: IssueData, validation: IssueValidation): void {
    const title = issue.title.toLowerCase();
    const body = issue.body.toLowerCase();
    
    // High-risk indicators
    const highRiskPatterns = [
      'build failed',
      'test failed',
      'deployment failed',
      'cannot find module',
      'database connection',
      'authentication error'
    ];

    // Medium-risk indicators
    const mediumRiskPatterns = [
      'error',
      'issue',
      'problem',
      'bug',
      'not working',
      'broken'
    ];

    // Check for common error patterns
    const hasHighRiskPattern = highRiskPatterns.some(pattern => 
      title.includes(pattern) || body.includes(pattern)
    );

    const hasMediumRiskPattern = mediumRiskPatterns.some(pattern => 
      title.includes(pattern) || body.includes(pattern)
    );

    // Check for generic titles
    const genericTitles = [
      'bug',
      'issue',
      'problem',
      'error',
      'help',
      'question',
      'not working'
    ];

    const hasGenericTitle = genericTitles.some(generic => 
      title === generic || title.startsWith(generic + ' ') || title.endsWith(' ' + generic)
    );

    if (hasHighRiskPattern || hasGenericTitle) {
      validation.duplicateRisk = 'high';
      validation.warnings.push('High duplicate risk - please search thoroughly before proceeding');
    } else if (hasMediumRiskPattern) {
      validation.duplicateRisk = 'medium';
      validation.suggestions.push('Medium duplicate risk - double-check for similar issues');
    }

    // Check if "None" is specified for related issues (good sign)
    if (body.includes('related issues') && body.includes('none')) {
      validation.duplicateRisk = 'low';
    }
  }

  private assessIssueQuality(issue: IssueData, validation: IssueValidation): void {
    const body = issue.body;
    
    // Check length
    if (body.length < 200) {
      validation.warnings.push('Issue description seems too short - please provide more details');
      validation.isValid = false;
    }

    // Check for code blocks
    if (!body.includes('```') && (issue.type === 'bug' || issue.type === 'build')) {
      validation.suggestions.push('Consider adding code blocks or error logs for better context');
    }

    // Check for structured information
    const hasStructure = body.includes('###') || body.includes('##') || 
                        body.includes('1.') || body.includes('-');

    if (!hasStructure) {
      validation.suggestions.push('Consider using structured formatting for better readability');
    }

    // Check for screenshots mention (for UI issues)
    if (body.includes('ui') || body.includes('interface') || body.includes('visual')) {
      if (!body.includes('screenshot') && !body.includes('image')) {
        validation.suggestions.push('Consider adding screenshots for UI-related issues');
      }
    }
  }

  private performTypeSpecificValidation(issue: IssueData, validation: IssueValidation): void {
    const body = issue.body.toLowerCase();

    switch (issue.type) {
      case 'security':
        // Check for sensitive data warnings
        if (body.includes('password') || body.includes('secret') || body.includes('key')) {
          validation.warnings.push('Please ensure no sensitive data is included in the issue');
        }
        
        // Check for severity assessment
        if (!body.includes('severity') && !body.includes('impact')) {
          validation.warnings.push('Security issues should include severity/impact assessment');
        }
        break;

      case 'build':
        // Check for CI/CD context
        if (!body.includes('workflow') && !body.includes('pipeline') && !body.includes('ci')) {
          validation.suggestions.push('Consider mentioning the specific workflow or CI context');
        }
        
        // Check for workflow run URL
        if (!body.includes('github.com') && !body.includes('actions/runs')) {
          validation.suggestions.push('Consider adding a link to the failing workflow run');
        }
        break;

      case 'config':
        // Check for environment details
        if (!body.includes('environment') && !body.includes('env')) {
          validation.warnings.push('Configuration issues should specify the affected environment');
        }
        
        // Check for security warning
        validation.suggestions.push('Remember to sanitize any sensitive configuration data');
        break;

      case 'feature':
        // Check for problem statement
        if (!body.includes('problem') && !body.includes('why')) {
          validation.suggestions.push('Feature requests benefit from explaining the problem they solve');
        }
        
        // Check for acceptance criteria
        if (!body.includes('acceptance') && !body.includes('criteria')) {
          validation.suggestions.push('Consider adding acceptance criteria for clarity');
        }
        break;
    }
  }

  generateSearchTerms(issue: IssueData): string[] {
    const title = issue.title.toLowerCase();
    const body = issue.body.toLowerCase();
    const terms: string[] = [];

    // Extract error messages
    const errorMatches = body.match(/error:?\s*([^\n]+)/gi);
    if (errorMatches) {
      terms.push(...errorMatches.map(e => e.replace(/error:?\s*/i, '').trim()));
    }

    // Extract component names
    const components = ['astro', 'nestjs', 'api', 'database', 'auth', 'docker', 'ci', 'cd'];
    components.forEach(comp => {
      if (title.includes(comp) || body.includes(comp)) {
        terms.push(comp);
      }
    });

    // Extract action words
    const actions = ['build', 'deploy', 'test', 'login', 'connect', 'install', 'run'];
    actions.forEach(action => {
      if (title.includes(action) || body.includes(action)) {
        terms.push(action);
      }
    });

    // Return unique terms
    return [...new Set(terms)];
  }
}

// Export for use in GitHub Actions or other scripts
export { IssueValidator, type IssueValidation, type IssueData };

// Example usage
if (require.main === module) {
  const validator = new IssueValidator();
  
  // Example issue data
  const exampleIssue: IssueData = {
    title: 'Build failed on main branch',
    body: `
    Related Issues: #123, None
    Keywords: build, failure, ci
    
    The build is failing with the following error:
    \`\`\`
    Error: Cannot find module 'express'
    \`\`\`
    
    Reproduction Steps:
    1. Push to main branch
    2. CI workflow runs
    3. Build step fails
    `,
    labels: ['bug', 'ci'],
    type: 'build'
  };

  const validation = validator.validateIssue(exampleIssue);
  const searchTerms = validator.generateSearchTerms(exampleIssue);

  console.log('Validation Results:');
  console.log('Valid:', validation.isValid);
  console.log('Duplicate Risk:', validation.duplicateRisk);
  console.log('Warnings:', validation.warnings);
  console.log('Suggestions:', validation.suggestions);
  console.log('Search Terms:', searchTerms);
}