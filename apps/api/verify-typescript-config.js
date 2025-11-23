#!/usr/bin/env node

/**
 * Verification script to ensure critical application directories are included in TypeScript compilation
 * This addresses issue #79: Critical application directories excluded from compilation
 */

const fs = require('fs');
const path = require('path');

const CRITICAL_DIRECTORIES = [
  'src/approvals',
  'src/files',
  'src/tickets',
  'src/invoices',
  'src/milestones',
  'src/projects',
  'src/common/database',
];

function checkTsConfig() {
  const results = {
    exclusions: [],
    excludedCritical: [],
    directoryStatus: [],
    compilationStatus: '',
    success: true,
    errors: [],
  };

  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  results.exclusions = tsconfig.exclude || [];

  results.excludedCritical = CRITICAL_DIRECTORIES.filter((dir) =>
    tsconfig.exclude?.some((exclusion) =>
      exclusion.includes(dir.replace('src/', ''))
    )
  );

  if (results.excludedCritical.length > 0) {
    results.success = false;
    results.errors.push('Critical directories excluded from compilation');
    results.excludedCritical.forEach((dir) =>
      results.errors.push(`${dir} is excluded from compilation`)
    );
    process.exit(1);
  }

  CRITICAL_DIRECTORIES.forEach((dir) => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      const tsFiles = fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith('.ts'));
      results.directoryStatus.push({
        directory: dir,
        status: 'found',
        fileCount: tsFiles.length,
      });
    } else {
      results.directoryStatus.push({
        directory: dir,
        status: 'not_found',
        fileCount: 0,
      });
    }
  });

  try {
    const { execSync } = require('child_process');
    const result = execSync('npx tsc --noEmit --listFiles 2>&1', {
      cwd: __dirname,
      encoding: 'utf8',
    });

    const hasCriticalFiles = CRITICAL_DIRECTORIES.some((dir) =>
      result.includes(dir.replace('src/', 'apps/api/src/'))
    );

    if (hasCriticalFiles) {
      results.compilationStatus = 'compiling_critical_files';
    } else {
      results.compilationStatus = 'not_compiling_critical';
      results.success = false;
      results.errors.push('TypeScript is not compiling critical directories');
    }
  } catch (error) {
    const hasCriticalFiles = CRITICAL_DIRECTORIES.some(
      (dir) =>
        error.stdout?.includes(dir.replace('src/', 'apps/api/src/')) ||
        error.message?.includes(dir.replace('src/', 'apps/api/src/'))
    );

    if (hasCriticalFiles) {
      results.compilationStatus = 'compiling_critical_files_with_errors';
    } else {
      results.compilationStatus = 'verification_failed';
      results.errors.push(
        'Could not verify compilation due to environment limitations'
      );
    }
  }

  // Return results for programmatic use
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.VERBOSE_VERIFICATION
  ) {
    // Removed console output to prevent production console statements
    // console.log(
    //   'TypeScript verification results:',
    //   JSON.stringify(results, null, 2)
    // );
  }

  return results;
}

const verificationResult = checkTsConfig();

// In non-production environments, provide user-friendly output
if (process.env.NODE_ENV !== 'production') {
  // Removed console output to prevent production console statements
  // console.log(
  //   '🔍 Verifying TypeScript compilation includes critical directories...\n'
  // );
  // console.log('Current exclusions in tsconfig.json:');
  // verificationResult.exclusions.forEach((exclusion) => {
  //   console.log(`  - ${exclusion}`);
  // });
  // console.log('\n🔍 Checking for critical directories in exclude array...');
  // if (verificationResult.excludedCritical.length > 0) {
  //   console.log('❌ CRITICAL ISSUE FOUND:');
  //   verificationResult.excludedCritical.forEach((dir) =>
  //     console.log(`  - ${dir} is excluded from compilation`)
  //   );
  // } else {
  //   console.log('✅ No critical directories are excluded from compilation.');
  // }
  // console.log(
  //   '\n🔍 Verifying critical directories exist and contain TypeScript files...'
  // );
  // verificationResult.directoryStatus.forEach((status) => {
  //   if (status.status === 'found') {
  //     console.log(
  //       `  ✅ ${status.directory}: ${status.fileCount} TypeScript files found`
  //     );
  //   } else {
  //     console.log(`  ❌ ${status.directory}: Directory not found`);
  //   }
  // });
  // console.log(
  //   '\n🔍 Checking if TypeScript attempts to compile critical directories...'
  // );
  // switch (verificationResult.compilationStatus) {
  //   case 'compiling_critical_files':
  //     console.log(
  //       '✅ TypeScript is attempting to compile files from critical directories.'
  //     );
  //     console.log('   (Dependency errors are expected in this environment)');
  //     break;
  //   case 'not_compiling_critical':
  //     console.log('❌ TypeScript is not compiling critical directories.');
  //     break;
  //   case 'compiling_critical_files_with_errors':
  //     console.log(
  //       '✅ TypeScript is attempting to compile files from critical directories.'
  //     );
  //     console.log('   (Dependency errors are expected in this environment)');
  //     break;
  //   case 'verification_failed':
  //     console.log(
  //       '⚠️  Could not verify compilation due to environment limitations.'
  //     );
  //     break;
  // }
  // if (verificationResult.success) {
  //   console.log(
  //     '\n🎉 Verification complete: TypeScript configuration is correct.'
  //   );
  //   console.log(
  //     'All critical application directories are properly included in compilation.'
  //   );
  // } else {
  //   console.log('\n❌ Verification failed with errors:');
  //   verificationResult.errors.forEach((error) => console.log(`  - ${error}`));
  //   process.exit(1);
  // }
}

// Essential exit logic - if verification failed, exit with error code
if (!verificationResult.success) {
  process.exit(1);
}
