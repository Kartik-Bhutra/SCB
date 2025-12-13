// Allow side-effect CSS imports
declare module '*.css';
declare module '*.scss';
declare module '*.sass';

// Allow CSS Module imports: import styles from '...module.css'
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}
