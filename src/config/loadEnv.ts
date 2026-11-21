import dotenv from 'dotenv';
import path from 'path';

// .env is the file you copy from .env.example. .env.local can override it
// for a machine-specific setup. Existing process env always wins.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
