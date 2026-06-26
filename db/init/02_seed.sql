-- サンプルデータ。自然言語クエリの練習が楽しくなる程度に投入。

INSERT INTO customers (name, email, country) VALUES
    ('Alice Tanaka',   'alice@example.com',   'JP'),
    ('Bob Smith',      'bob@example.com',     'US'),
    ('Carol Nguyen',   'carol@example.com',   'VN'),
    ('Dan O''Brien',   'dan@example.com',     'IE'),
    ('Emi Sato',       'emi@example.com',     'JP');

INSERT INTO products (name, category, price_cents) VALUES
    ('Keyboard',       'electronics', 8000),
    ('Mouse',          'electronics', 3500),
    ('USB-C Cable',    'accessories',  1200),
    ('Monitor 27"',    'electronics', 32000),
    ('Notebook',       'stationery',   600),
    ('Desk Lamp',      'home',         4500);

-- 注文（顧客ごとに偏りを付けて分析ネタにする）。
INSERT INTO orders (customer_id, status, ordered_at) VALUES
    (1, 'paid',     now() - interval '10 days'),
    (1, 'paid',     now() - interval '3 days'),
    (2, 'paid',     now() - interval '7 days'),
    (3, 'refunded', now() - interval '5 days'),
    (5, 'paid',     now() - interval '1 day');

-- 注文明細。
INSERT INTO order_items (order_id, product_id, quantity) VALUES
    (1, 1, 1),   -- Alice: Keyboard
    (1, 2, 2),   -- Alice: Mouse x2
    (2, 4, 1),   -- Alice: Monitor
    (3, 3, 5),   -- Bob:   USB-C Cable x5
    (3, 5, 3),   -- Bob:   Notebook x3
    (4, 6, 1),   -- Carol: Desk Lamp (refunded)
    (5, 1, 1),   -- Emi:   Keyboard
    (5, 2, 1);   -- Emi:   Mouse
