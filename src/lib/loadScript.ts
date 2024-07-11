type ScriptAttributes = {
    referrerpolicy?: string;
    integrity?: string;
    crossorigin?: string;
    type?: string;
    async?: boolean;
    defer?: boolean;
  };
  
  export function loadScript(src: string, attributes: ScriptAttributes = {}): Promise<HTMLScriptElement> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
  
      // Set known attributes explicitly
      if (attributes.referrerpolicy) script.referrerPolicy = attributes.referrerpolicy;
      if (attributes.integrity) script.integrity = attributes.integrity;
      if (attributes.crossorigin) script.crossOrigin = attributes.crossorigin;
      if (attributes.type) script.type = attributes.type;
      if (attributes.async !== undefined) script.async = attributes.async;
      if (attributes.defer !== undefined) script.defer = attributes.defer;
  
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }