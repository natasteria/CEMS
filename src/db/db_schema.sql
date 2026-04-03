-- PROFILES
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text,
    last_name text,
    email text unique not null,
    phone_number text,
    role text not null check (role in ('student','organizer','admin')),
    created_at timestamp default now()
);

-- STUDENTS
create table students (
    id uuid primary key references profiles(id) on delete cascade,
    department text not null
        check (
            department IN (
                'Accounting & Finance',
                'Management',
                'Marketing Management',
                'Computer Science',
                'Economics',
                'Architecture and Urban Planning',
                'Nursing'
            )
        ),
    student_id_number text not null unique,
    batch_year integer not null
        check (batch_year BETWEEN 2013 AND 2018),
    account_status text default 'active'
        check (account_status IN ('active','banned'))
);

-- ADMINS
create table admins (
    id uuid primary key references profiles(id) on delete cascade
);

-- ORGANIZERS
create table organizers (
    id uuid primary key references profiles(id) on delete cascade,
    organizer_name text not null,
    organizer_type text not null,
    registration_status text default 'pending'
        check (registration_status in ('pending', 'approved', 'rejected')),
    account_status text default 'active'
        check (account_status in ('active','banned')),
    reviewed_by uuid references admins(id)
);

-- EVENTS (UPDATED HERE ✅)
create table events (
    id uuid primary key default gen_random_uuid(),
    organizer_id uuid not null references organizers(id) on delete cascade,
    title text not null,
    description text,
    start_datetime timestamp not null,
    end_datetime timestamp not null,
    venue text not null,
    capacity integer not null check (capacity > 0),
    registration_deadline timestamp,
    image_url text,
    status text not null default 'pending'
        check (status in ('pending','approved','rejected','edited')),
    deleted_at timestamp,
    deleted_by uuid references auth.users(id),
    deletion_note text
);

-- EVENT STATUS HISTORY
create table event_status (
    status_id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    admin_id uuid references admins(id),
    status_assigned text not null
        check (status_assigned in ('pending','approved','rejected','edited')),
    rejection_note text,
    created_at timestamp default now()
);

-- REGISTRATIONS
create table registrations (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references students(id) on delete cascade,
    event_id uuid not null references events(id) on delete cascade,
    registration_date timestamp default now(),
    registration_status text default 'registered',
    unique(student_id, event_id)
);

-- NOTIFICATIONS
create table notifications (
    notification_id uuid primary key default gen_random_uuid(),
    notification_type text not null,
    template_data jsonb,
    recipient_id uuid not null references auth.users(id),
    created_at timestamp default now()
);