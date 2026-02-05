/**
 * API routes for catalogs: rider items, night leads, person names,
 * bestueckung lists, wage options, person wages. Mirror store shape (camelCase in JSON).
 */

const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

function poolOr503(req, res, next) {
  if (!getPool()) return res.status(503).json({ error: 'Database not configured' });
  next();
}

router.use(poolOr503);

function toRiderItem(row) {
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    ekPrice: row.ek_price != null ? parseFloat(row.ek_price) : null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at
  };
}

function toNightLead(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at
  };
}

function toPersonName(row) {
  return { id: row.id, name: row.name };
}

// ---- Rider items ----
router.get('/rider-items', async (req, res) => {
  try {
    const r = await getPool().query('SELECT id, name, price, ek_price, created_at FROM rider_items ORDER BY created_at');
    res.json(r.rows.map(toRiderItem));
  } catch (err) {
    console.error('GET /api/catalogs/rider-items:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/rider-items', async (req, res) => {
  const { name, price, ekPrice } = req.body || {};
  try {
    const r = await getPool().query(
      'INSERT INTO rider_items (name, price, ek_price) VALUES ($1, $2, $3) RETURNING id, name, price, ek_price, created_at',
      [name ?? '', parseFloat(price) || 0, ekPrice != null ? parseFloat(ekPrice) : null]
    );
    res.status(201).json(toRiderItem(r.rows[0]));
  } catch (err) {
    console.error('POST /api/catalogs/rider-items:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.patch('/rider-items/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const updates = [];
    const values = [id];
    let n = 2;
    if (body.name !== undefined) { updates.push(`name = $${n++}`); values.push(body.name); }
    if (body.price !== undefined) { updates.push(`price = $${n++}`); values.push(parseFloat(body.price)); }
    if (body.ekPrice !== undefined) { updates.push(`ek_price = $${n++}`); values.push(body.ekPrice == null ? null : parseFloat(body.ekPrice)); }
    if (updates.length === 0) {
      const r = await getPool().query('SELECT id, name, price, ek_price, created_at FROM rider_items WHERE id = $1', [id]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(toRiderItem(r.rows[0]));
    }
    const r = await getPool().query(
      `UPDATE rider_items SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, price, ek_price, created_at`,
      values
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(toRiderItem(r.rows[0]));
  } catch (err) {
    console.error('PATCH /api/catalogs/rider-items/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/rider-items/:id', async (req, res) => {
  try {
    const r = await getPool().query('DELETE FROM rider_items WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('DELETE /api/catalogs/rider-items/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- Night leads ----
router.get('/night-leads', async (req, res) => {
  try {
    const r = await getPool().query('SELECT id, name, created_at FROM night_leads ORDER BY created_at');
    res.json(r.rows.map(toNightLead));
  } catch (err) {
    console.error('GET /api/catalogs/night-leads:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/night-leads', async (req, res) => {
  const { name } = req.body || {};
  try {
    const r = await getPool().query(
      'INSERT INTO night_leads (name) VALUES ($1) RETURNING id, name, created_at',
      [name ?? '']
    );
    res.status(201).json(toNightLead(r.rows[0]));
  } catch (err) {
    console.error('POST /api/catalogs/night-leads:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.patch('/night-leads/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body || {};
  try {
    const r = await getPool().query(
      'UPDATE night_leads SET name = COALESCE($2, name) WHERE id = $1 RETURNING id, name, created_at',
      [id, name]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(toNightLead(r.rows[0]));
  } catch (err) {
    console.error('PATCH /api/catalogs/night-leads/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/night-leads/:id', async (req, res) => {
  try {
    const r = await getPool().query('DELETE FROM night_leads WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('DELETE /api/catalogs/night-leads/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- Person names (type: secu | tech | andere) ----
const PERSON_TYPES = ['secu', 'tech', 'andere'];

router.get('/person-names/:type', async (req, res) => {
  const type = req.params.type;
  if (!PERSON_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  try {
    const r = await getPool().query(
      'SELECT id, name FROM person_names WHERE type = $1 ORDER BY name',
      [type]
    );
    res.json(r.rows.map(toPersonName));
  } catch (err) {
    console.error('GET /api/catalogs/person-names/:type:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/person-names/:type', async (req, res) => {
  const type = req.params.type;
  if (!PERSON_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  const name = (req.body?.name ?? req.body ?? '').toString().trim();
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const existing = await getPool().query(
      'SELECT id, name FROM person_names WHERE type = $1 AND LOWER(TRIM(name)) = LOWER($2)',
      [type, name]
    );
    if (existing.rows.length > 0) return res.json(toPersonName(existing.rows[0]));
    const r = await getPool().query(
      'INSERT INTO person_names (type, name) VALUES ($1, $2) RETURNING id, name',
      [type, name]
    );
    res.status(201).json(toPersonName(r.rows[0]));
  } catch (err) {
    console.error('POST /api/catalogs/person-names/:type:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/person-names/remove', async (req, res) => {
  const name = (req.body?.name ?? '').toString().trim();
  if (!name) return res.json({ removed: false });
  const keyLower = name.toLowerCase();
  try {
    await getPool().query(
      "DELETE FROM person_names WHERE LOWER(TRIM(name)) = $1",
      [keyLower]
    );
    await getPool().query(
      "DELETE FROM person_wages WHERE LOWER(TRIM(person_name_key)) = $1",
      [keyLower]
    );
    res.json({ removed: true });
  } catch (err) {
    console.error('POST /api/catalogs/person-names/remove:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- Bestückung lists ----
router.get('/bestueckung-lists', async (req, res) => {
  try {
    const lists = await getPool().query('SELECT list_key, total_price, pricing_type FROM bestueckung_lists');
    const items = await getPool().query('SELECT list_key, rider_item_id AS "riderItemId", amount FROM bestueckung_list_items');
    const byKey = {};
    for (const row of lists.rows) {
      byKey[row.list_key] = {
        items: items.rows.filter(i => i.list_key === row.list_key).map(i => ({ riderItemId: i.riderItemId, amount: parseFloat(i.amount) })),
        totalPrice: row.total_price ?? '',
        pricingType: row.pricing_type ?? 'pauschale'
      };
    }
    res.json(byKey);
  } catch (err) {
    console.error('GET /api/catalogs/bestueckung-lists:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/bestueckung-lists/:key', async (req, res) => {
  try {
    const items = await getPool().query(
      'SELECT rider_item_id AS "riderItemId", amount FROM bestueckung_list_items WHERE list_key = $1',
      [req.params.key]
    );
    const meta = await getPool().query('SELECT total_price, pricing_type FROM bestueckung_lists WHERE list_key = $1', [req.params.key]);
    const totalPrice = meta.rows[0]?.total_price ?? '';
    const pricingType = meta.rows[0]?.pricing_type ?? 'pauschale';
    res.json({
      items: items.rows.map(i => ({ riderItemId: i.riderItemId, amount: parseFloat(i.amount) })),
      totalPrice,
      pricingType
    });
  } catch (err) {
    console.error('GET /api/catalogs/bestueckung-lists/:key:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/bestueckung-lists/:key', async (req, res) => {
  const { key } = req.params;
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  try {
    await getPool().query('DELETE FROM bestueckung_list_items WHERE list_key = $1', [key]);
    for (const it of items) {
      const riderItemId = it.riderItemId ?? it.rider_item_id;
      const amount = parseFloat(it.amount) || 1;
      if (riderItemId) {
        await getPool().query(
          'INSERT INTO bestueckung_list_items (list_key, rider_item_id, amount) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [key, riderItemId, amount]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/catalogs/bestueckung-lists/:key:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.patch('/bestueckung-lists/:key/meta', async (req, res) => {
  const { key } = req.params;
  const { totalPrice, pricingType } = req.body || {};
  try {
    await getPool().query(
      'UPDATE bestueckung_lists SET total_price = COALESCE($2, total_price), pricing_type = COALESCE($3, pricing_type) WHERE list_key = $1',
      [key, totalPrice, pricingType]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/catalogs/bestueckung-lists/:key/meta:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- Roles (user-defined; wage per role, numeric €/h) ----
function toRole(row) {
  const hw = row.hourly_wage;
  return {
    id: row.id,
    name: row.name,
    hourlyWage: hw != null ? Number(hw) : 0,
    sortOrder: row.sort_order ?? 0
  };
}

router.get('/roles', async (req, res) => {
  try {
    const r = await getPool().query('SELECT id, name, hourly_wage, sort_order FROM roles ORDER BY sort_order, name');
    res.json(r.rows.map(toRole));
  } catch (err) {
    console.error('GET /api/catalogs/roles:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/roles', async (req, res) => {
  const { name, hourlyWage, sortOrder } = req.body || {};
  const n = (name ?? '').toString().trim();
  if (!n) return res.status(400).json({ error: 'name required' });
  const wage = hourlyWage != null ? parseFloat(hourlyWage) : 0;
  try {
    const r = await getPool().query(
      'INSERT INTO roles (name, hourly_wage, sort_order) VALUES ($1, $2, $3) RETURNING id, name, hourly_wage, sort_order',
      [n, Number.isFinite(wage) ? wage : 0, sortOrder != null ? parseInt(sortOrder, 10) : 0]
    );
    res.status(201).json(toRole(r.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Role name already exists' });
    console.error('POST /api/catalogs/roles:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.patch('/roles/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const updates = [];
  const values = [id];
  let n = 2;
  if (body.name !== undefined) { updates.push(`name = $${n++}`); values.push((body.name ?? '').toString().trim()); }
  if (body.hourlyWage !== undefined) {
    const w = parseFloat(body.hourlyWage);
    updates.push(`hourly_wage = $${n++}`);
    values.push(Number.isFinite(w) ? w : 0);
  }
  if (body.sortOrder !== undefined) { updates.push(`sort_order = $${n++}`); values.push(parseInt(body.sortOrder, 10) || 0); }
  if (updates.length === 0) {
    try {
      const r = await getPool().query('SELECT id, name, hourly_wage, sort_order FROM roles WHERE id = $1', [id]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(toRole(r.rows[0]));
    } catch (err) {
      console.error('PATCH /api/catalogs/roles/:id (get):', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
  try {
    const r = await getPool().query(
      `UPDATE roles SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, hourly_wage, sort_order`,
      values
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(toRole(r.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Role name already exists' });
    console.error('PATCH /api/catalogs/roles/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await getPool().query('DELETE FROM roles WHERE id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/catalogs/roles/:id:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---- Person wages (custom wage overrides only; numeric €/h) ----
router.get('/person-wages', async (req, res) => {
  try {
    const r = await getPool().query('SELECT person_name_key AS "personNameKey", hourly_wage AS "hourlyWage" FROM person_wages');
    const obj = {};
    for (const row of r.rows) obj[row.personNameKey] = row.hourlyWage != null ? Number(row.hourlyWage) : 0;
    res.json(obj);
  } catch (err) {
    console.error('GET /api/catalogs/person-wages:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/person-wages', async (req, res) => {
  const wages = req.body && typeof req.body === 'object' ? req.body : {};
  try {
    await getPool().query('DELETE FROM person_wages');
    for (const [key, val] of Object.entries(wages)) {
      const k = (key || '').trim();
      if (k && val != null) {
        const w = parseFloat(val);
        const num = Number.isFinite(w) ? w : 0;
        await getPool().query('INSERT INTO person_wages (person_name_key, hourly_wage) VALUES ($1, $2)', [k, num]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/catalogs/person-wages:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
