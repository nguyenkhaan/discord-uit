
INSERT INTO react_icon (
    id,
    icon_image,
    name,
    summary,
    created_at
)
VALUES
(
    '00000000-0000-0000-0000-000000001204',
    '😆',
    'Happy',
    'Express happiness or joy',
    NOW()
),
(
    '00000000-0000-0000-0000-000000001205',
    '😢',
    'Sad',
    'Express sadness or sympathy',
    NOW()
),
(
    '00000000-0000-0000-0000-000000001206',
    '😮',
    'Surprised',
    'Express surprise or amazement',
    NOW()
),
(
    '00000000-0000-0000-0000-000000001207',
    '😡',
    'Angry',
    'Express anger or frustration',
    NOW()
)
ON CONFLICT (id) DO NOTHING;
