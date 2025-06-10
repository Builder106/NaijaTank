INSERT INTO public.brand_info (brand_key, website) VALUES
   ('Mobil', 'https://mobil.com'),
   ('Shell', 'https://www.shell.com'),
   ('Chevron', 'https://www.chevron.com'),
   ('Total', 'https://www.totalenergies.com'),
   ('NNPC', 'https://www.nnpcgroup.com'),
   ('Oando', 'https://www.oandoplc.com'),
   ('Conoil', 'https://www.conoilplc.com'),
   ('Ardova', 'https://www.ardovaplc.com'),
   ('MRS', 'https://mrsholdings.com')
ON CONFLICT (brand_key) DO NOTHING; 
-- 'Other' and 'Unknown' might not need entries here unless you want to store specific info for them.