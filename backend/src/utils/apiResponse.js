function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function noContent(res) {
  return res.status(204).send();
}

function fail(res, status, message, details) {
  const body = { success: false, error: { message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

module.exports = { ok, created, noContent, fail };
