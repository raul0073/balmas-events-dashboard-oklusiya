-- The infrastructure list grew; rows that still carry the old keys move to the new ones.
update public.events set infrastructure_type = 'private_home' where infrastructure_type = 'house';
update public.events set infrastructure_type = 'residential'  where infrastructure_type = 'building';
update public.events set infrastructure_type = 'education'    where infrastructure_type = 'school';
