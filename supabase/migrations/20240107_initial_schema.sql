-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create channels table
create table channels (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique,
  description text
);

-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  channel_id uuid references channels on delete cascade not null,
  user_id uuid references profiles on delete cascade not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Channels are viewable by everyone"
  on channels for select
  using (true);

create policy "Authenticated users can create channels"
  on channels for insert
  with check (auth.role() = 'authenticated');

create policy "Messages are viewable by everyone"
  on messages for select
  using (true);

create policy "Authenticated users can insert messages"
  on messages for insert
  with check (auth.role() = 'authenticated');

-- Create functions
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 