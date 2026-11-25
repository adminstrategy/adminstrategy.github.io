(() => {
  'use strict';
  const menu = document.querySelector('.mobile-menu');
  if (menu) {
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
  }
  document.addEventListener('click', event => {
    if (menu && menu.open && !menu.contains(event.target)) menu.open = false;
  });
  const form = document.querySelector('#consultForm');
  if (!form) return;
  const topics = {
    'business-certification': '기업 인증·진단',
    'business-planning': '사업계획·정책자금',
    visa: '외국인·비자', nonprofit: '비영리·단체',
    licensing: '인허가', 'fact-finding': '사실조사·자료 확인'
  };
  const key = new URLSearchParams(window.location.search).get('topic');
  const requestedTopic = Object.prototype.hasOwnProperty.call(topics, key) ? topics[key] : null;
  if (requestedTopic) form.elements.topic.value = requestedTopic;
  const button = document.getElementById('submitBtn');
  const note = document.getElementById('formNote');
  const newInquiry = document.getElementById('newInquiry');
  const phoneLink = document.getElementById('formPhone');
  let pending = false;
  let completed = false;
  newInquiry.addEventListener('click', () => {
    if (pending) return;
    form.reset();
    if (requestedTopic) form.elements.topic.value = requestedTopic;
    completed = false;
    button.disabled = false;
    button.textContent = '상담 신청';
    note.textContent = '';
    phoneLink.hidden = true;
    delete note.dataset.state;
    newInquiry.hidden = true;
    form.elements.name.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || completed) return;
    pending = true;
    button.disabled = true;
    button.textContent = '전송 중…';
    form.setAttribute('aria-busy', 'true');
    note.textContent = '상담 내용을 전송하고 있습니다.';
    phoneLink.hidden = true;
    delete note.dataset.state;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(form.action, {
        method: form.method, headers: { Accept: 'application/json' },
        body: new FormData(form), signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data.success) throw new Error('Submission failed');
      completed = true;
      button.textContent = '전송 완료';
      newInquiry.hidden = false;
      note.textContent = '상담 신청이 접수되었습니다. 확인한 뒤 연락드리겠습니다.';
      note.dataset.state = 'success';
    } catch (error) {
      button.disabled = false;
      button.textContent = '상담 신청';
      note.textContent = error.name === 'AbortError'
        ? '응답이 늦어지고 있습니다. 접수 여부는 전화로 확인해 주세요.'
        : '전송하지 못했습니다. 다시 시도하거나 전화로 문의해 주세요.';
      phoneLink.hidden = false;
      note.dataset.state = 'error';
    } finally {
      clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
